use base64::{engine::general_purpose::STANDARD as B64, Engine};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    XChaCha20Poly1305, XNonce,
};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, State,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream, UdpSocket},
    sync::RwLock,
};
use uuid::Uuid;
use x25519_dalek::{PublicKey, StaticSecret};

const TCP_PORT: u16 = 38_741;
const DISCOVERY_PORT: u16 = 38_742;
const MAX_WIRE_BYTES: usize = 131_072;
const MAX_TEXT_BYTES: usize = 32_768;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Identity {
    device_id: String,
    device_name: String,
    secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredPeer {
    id: String,
    name: String,
    public_key: String,
    address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredConfig {
    identity: Identity,
    #[serde(default)]
    peers: Vec<StoredPeer>,
}

#[derive(Debug, Clone, Serialize)]
struct PeerView {
    id: String,
    name: String,
    address: String,
    online: bool,
    paired: bool,
    last_seen: u64,
}

#[derive(Debug, Clone, Serialize)]
struct PairingView {
    peer_id: String,
    peer_name: String,
    code: String,
    direction: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TransferView {
    id: String,
    peer_id: String,
    peer_name: String,
    text: String,
    created_at: u64,
    expires_at: u64,
    status: String,
}

#[derive(Debug, Serialize)]
struct Snapshot {
    device_id: String,
    device_name: String,
    network_ready: bool,
    network_error: Option<String>,
    peers: Vec<PeerView>,
    pairings: Vec<PairingView>,
    inbox: Vec<TransferView>,
    sent: Vec<TransferView>,
}

#[derive(Debug, Clone)]
struct DiscoveredPeer {
    id: String,
    name: String,
    public_key: String,
    address: String,
    last_seen: u64,
}

#[derive(Debug, Clone)]
struct PendingPair {
    peer: DiscoveredPeer,
    code: String,
    direction: String,
}

struct Inner {
    config: StoredConfig,
    config_path: PathBuf,
    discovered: HashMap<String, DiscoveredPeer>,
    pending: HashMap<String, PendingPair>,
    inbox: Vec<TransferView>,
    sent: Vec<TransferView>,
    network_ready: bool,
    network_error: Option<String>,
}

struct AppState(Arc<RwLock<Inner>>);

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
enum WireMessage {
    Announce {
        device_id: String,
        device_name: String,
        public_key: String,
        port: u16,
    },
    PairRequest {
        device_id: String,
        device_name: String,
        public_key: String,
        port: u16,
    },
    PairAccept {
        device_id: String,
        device_name: String,
        public_key: String,
        port: u16,
    },
    Transfer {
        sender_id: String,
        transfer_id: String,
        nonce: String,
        ciphertext: String,
        created_at: u64,
        expires_at: u64,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct WireReply {
    ok: bool,
    reason: String,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn fresh_identity() -> Identity {
    let secret = StaticSecret::random_from_rng(OsRng);
    let suffix = &Uuid::new_v4().simple().to_string()[..4];
    Identity {
        device_id: Uuid::new_v4().to_string(),
        device_name: format!("Bridge {suffix}"),
        secret: B64.encode(secret.to_bytes()),
    }
}

fn load_config(path: PathBuf) -> StoredConfig {
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| StoredConfig {
            identity: fresh_identity(),
            peers: vec![],
        })
}

fn save_config(inner: &Inner) -> Result<(), String> {
    if let Some(parent) = inner.config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_vec_pretty(&inner.config).map_err(|e| e.to_string())?;
    fs::write(&inner.config_path, data).map_err(|e| e.to_string())
}

fn secret(identity: &Identity) -> Result<StaticSecret, String> {
    let bytes: [u8; 32] = B64
        .decode(&identity.secret)
        .map_err(|_| "Invalid local identity".to_string())?
        .try_into()
        .map_err(|_| "Invalid local identity".to_string())?;
    Ok(StaticSecret::from(bytes))
}

fn public_key(identity: &Identity) -> Result<String, String> {
    Ok(B64.encode(PublicKey::from(&secret(identity)?).as_bytes()))
}

fn decode_public(value: &str) -> Result<PublicKey, String> {
    let bytes: [u8; 32] = B64
        .decode(value)
        .map_err(|_| "Invalid peer key".to_string())?
        .try_into()
        .map_err(|_| "Invalid peer key".to_string())?;
    Ok(PublicKey::from(bytes))
}

fn pair_code(a: &str, b: &str) -> String {
    let mut keys = [a, b];
    keys.sort_unstable();
    let digest = Sha256::digest(format!("{}:{}", keys[0], keys[1]).as_bytes());
    format!("{:02X}{:02X}{:02X}", digest[0], digest[1], digest[2])
}

fn cipher(identity: &Identity, peer_key: &str) -> Result<XChaCha20Poly1305, String> {
    let shared = secret(identity)?.diffie_hellman(&decode_public(peer_key)?);
    let key = Sha256::digest([b"clipboard-lan-bridge-v1".as_slice(), shared.as_bytes()].concat());
    Ok(XChaCha20Poly1305::new_from_slice(&key)
        .map_err(|_| "Encryption setup failed".to_string())?)
}

fn encrypt(identity: &Identity, peer_key: &str, text: &str) -> Result<(String, String), String> {
    if text.as_bytes().len() > MAX_TEXT_BYTES {
        return Err("Text must be 32 KB or less".into());
    }
    let mut nonce = [0u8; 24];
    OsRng.fill_bytes(&mut nonce);
    let ciphertext = cipher(identity, peer_key)?
        .encrypt(XNonce::from_slice(&nonce), text.as_bytes())
        .map_err(|_| "Encryption failed".to_string())?;
    Ok((B64.encode(nonce), B64.encode(ciphertext)))
}

fn decrypt(
    identity: &Identity,
    peer_key: &str,
    nonce: &str,
    ciphertext: &str,
) -> Result<String, String> {
    let nonce: [u8; 24] = B64
        .decode(nonce)
        .map_err(|_| "Invalid nonce".to_string())?
        .try_into()
        .map_err(|_| "Invalid nonce".to_string())?;
    let encrypted = B64
        .decode(ciphertext)
        .map_err(|_| "Invalid ciphertext".to_string())?;
    let clear = cipher(identity, peer_key)?
        .decrypt(XNonce::from_slice(&nonce), encrypted.as_ref())
        .map_err(|_| "Message authentication failed".to_string())?;
    if clear.len() > MAX_TEXT_BYTES {
        return Err("Transfer exceeds 32 KB".into());
    }
    String::from_utf8(clear).map_err(|_| "Only UTF-8 text is accepted".to_string())
}

async fn write_message(stream: &mut TcpStream, message: &WireMessage) -> Result<WireReply, String> {
    let data = serde_json::to_vec(message).map_err(|e| e.to_string())?;
    stream
        .write_u32(data.len() as u32)
        .await
        .map_err(|e| e.to_string())?;
    stream.write_all(&data).await.map_err(|e| e.to_string())?;
    let size = stream.read_u32().await.map_err(|e| e.to_string())? as usize;
    if size > 4096 {
        return Err("Invalid peer response".into());
    }
    let mut reply = vec![0; size];
    stream
        .read_exact(&mut reply)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::from_slice(&reply).map_err(|e| e.to_string())
}

async fn send_to(address: &str, message: &WireMessage) -> Result<WireReply, String> {
    let mut stream = tokio::time::timeout(Duration::from_secs(4), TcpStream::connect(address))
        .await
        .map_err(|_| "Device did not respond in time".to_string())?
        .map_err(|_| "Device is no longer reachable on this LAN".to_string())?;
    tokio::time::timeout(Duration::from_secs(5), write_message(&mut stream, message))
        .await
        .map_err(|_| "Device did not acknowledge the transfer".to_string())?
}

async fn handle_connection(
    mut stream: TcpStream,
    remote: SocketAddr,
    shared: Arc<RwLock<Inner>>,
) -> Result<(), String> {
    let size = stream.read_u32().await.map_err(|e| e.to_string())? as usize;
    if size > MAX_WIRE_BYTES {
        return Err("Message too large".into());
    }
    let mut data = vec![0; size];
    stream
        .read_exact(&mut data)
        .await
        .map_err(|e| e.to_string())?;
    let message: WireMessage =
        serde_json::from_slice(&data).map_err(|_| "Invalid message".to_string())?;
    let result = process_message(message, remote.ip(), shared).await;
    let reply = match &result {
        Ok(_) => WireReply {
            ok: true,
            reason: "accepted".into(),
        },
        Err(reason) => WireReply {
            ok: false,
            reason: reason.clone(),
        },
    };
    let bytes = serde_json::to_vec(&reply).map_err(|e| e.to_string())?;
    stream
        .write_u32(bytes.len() as u32)
        .await
        .map_err(|e| e.to_string())?;
    stream.write_all(&bytes).await.map_err(|e| e.to_string())?;
    result
}

async fn process_message(
    message: WireMessage,
    remote_ip: IpAddr,
    shared: Arc<RwLock<Inner>>,
) -> Result<(), String> {
    match message {
        WireMessage::PairRequest {
            device_id,
            device_name,
            public_key: pk,
            port,
        } => {
            let mut inner = shared.write().await;
            let own_pk = public_key(&inner.config.identity)?;
            let peer = DiscoveredPeer {
                id: device_id.clone(),
                name: device_name,
                public_key: pk.clone(),
                address: format!("{remote_ip}:{port}"),
                last_seen: now_ms(),
            };
            let code = pair_code(&own_pk, &pk);
            inner.discovered.insert(device_id.clone(), peer.clone());
            inner.pending.insert(
                device_id,
                PendingPair {
                    peer,
                    code,
                    direction: "incoming".into(),
                },
            );
        }
        WireMessage::PairAccept {
            device_id,
            device_name,
            public_key: pk,
            port,
        } => {
            let mut inner = shared.write().await;
            let pending = inner
                .pending
                .get(&device_id)
                .ok_or("Unexpected pairing approval")?;
            if pending.direction != "outgoing" || pending.peer.public_key != pk {
                return Err("Pairing keys did not match".into());
            }
            let stored = StoredPeer {
                id: device_id.clone(),
                name: device_name,
                public_key: pk,
                address: format!("{remote_ip}:{port}"),
            };
            inner.config.peers.retain(|p| p.id != device_id);
            inner.config.peers.push(stored);
            inner.pending.remove(&device_id);
            save_config(&inner)?;
        }
        WireMessage::Transfer {
            sender_id,
            transfer_id,
            nonce,
            ciphertext,
            created_at,
            expires_at,
        } => {
            if expires_at <= now_ms() || expires_at > created_at + 3_600_000 {
                return Err("Transfer expiry is invalid".into());
            }
            let mut inner = shared.write().await;
            let peer = inner
                .config
                .peers
                .iter()
                .find(|p| p.id == sender_id)
                .cloned()
                .ok_or("Sender is not paired")?;
            let text = decrypt(
                &inner.config.identity,
                &peer.public_key,
                &nonce,
                &ciphertext,
            )?;
            inner.inbox.retain(|t| t.expires_at > now_ms());
            if !inner.inbox.iter().any(|t| t.id == transfer_id) {
                inner.inbox.push(TransferView {
                    id: transfer_id,
                    peer_id: sender_id,
                    peer_name: peer.name,
                    text,
                    created_at,
                    expires_at,
                    status: "received".into(),
                });
            }
        }
        WireMessage::Announce { .. } => {}
    }
    Ok(())
}

async fn run_network(shared: Arc<RwLock<Inner>>) {
    let listener = match TcpListener::bind(("0.0.0.0", TCP_PORT)).await {
        Ok(v) => v,
        Err(e) => {
            let mut inner = shared.write().await;
            inner.network_error = Some(format!("Local port {TCP_PORT} is unavailable: {e}"));
            return;
        }
    };
    {
        let mut inner = shared.write().await;
        inner.network_ready = true;
        inner.network_error = None;
    }
    let accept_state = shared.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            if let Ok((stream, remote)) = listener.accept().await {
                let state = accept_state.clone();
                tauri::async_runtime::spawn(async move {
                    let _ = handle_connection(stream, remote, state).await;
                });
            }
        }
    });

    let socket = match UdpSocket::bind(("0.0.0.0", DISCOVERY_PORT)).await {
        Ok(v) => Arc::new(v),
        Err(e) => {
            shared.write().await.network_error = Some(format!("Discovery unavailable: {e}"));
            return;
        }
    };
    let _ = socket.set_broadcast(true);
    let announce_socket = socket.clone();
    let announce_state = shared.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            let msg = {
                let inner = announce_state.read().await;
                WireMessage::Announce {
                    device_id: inner.config.identity.device_id.clone(),
                    device_name: inner.config.identity.device_name.clone(),
                    public_key: public_key(&inner.config.identity).unwrap_or_default(),
                    port: TCP_PORT,
                }
            };
            if let Ok(data) = serde_json::to_vec(&msg) {
                let _ = announce_socket
                    .send_to(&data, ("255.255.255.255", DISCOVERY_PORT))
                    .await;
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
    let mut buf = vec![0u8; 4096];
    loop {
        if let Ok((count, remote)) = socket.recv_from(&mut buf).await {
            if let Ok(WireMessage::Announce {
                device_id,
                device_name,
                public_key,
                port,
            }) = serde_json::from_slice(&buf[..count])
            {
                let mut inner = shared.write().await;
                if device_id != inner.config.identity.device_id {
                    inner.discovered.insert(
                        device_id.clone(),
                        DiscoveredPeer {
                            id: device_id,
                            name: device_name,
                            public_key,
                            address: format!("{}:{port}", remote.ip()),
                            last_seen: now_ms(),
                        },
                    );
                }
            }
        }
    }
}

#[tauri::command]
async fn get_snapshot(state: State<'_, AppState>) -> Result<Snapshot, String> {
    let mut inner = state.0.write().await;
    let now = now_ms();
    inner.inbox.retain(|t| t.expires_at > now);
    inner.sent.retain(|t| t.expires_at > now);
    let mut peers: HashMap<String, PeerView> = inner
        .config
        .peers
        .iter()
        .map(|p| {
            (
                p.id.clone(),
                PeerView {
                    id: p.id.clone(),
                    name: p.name.clone(),
                    address: p.address.clone(),
                    online: inner
                        .discovered
                        .get(&p.id)
                        .is_some_and(|d| now - d.last_seen < 8_000),
                    paired: true,
                    last_seen: inner.discovered.get(&p.id).map_or(0, |d| d.last_seen),
                },
            )
        })
        .collect();
    for d in inner.discovered.values() {
        peers.entry(d.id.clone()).or_insert(PeerView {
            id: d.id.clone(),
            name: d.name.clone(),
            address: d.address.clone(),
            online: now - d.last_seen < 8_000,
            paired: false,
            last_seen: d.last_seen,
        });
    }
    let pairings = inner
        .pending
        .values()
        .map(|p| PairingView {
            peer_id: p.peer.id.clone(),
            peer_name: p.peer.name.clone(),
            code: p.code.clone(),
            direction: p.direction.clone(),
        })
        .collect();
    Ok(Snapshot {
        device_id: inner.config.identity.device_id.clone(),
        device_name: inner.config.identity.device_name.clone(),
        network_ready: inner.network_ready,
        network_error: inner.network_error.clone(),
        peers: peers.into_values().collect(),
        pairings,
        inbox: inner.inbox.clone(),
        sent: inner.sent.clone(),
    })
}

#[tauri::command]
async fn set_device_name(name: String, state: State<'_, AppState>) -> Result<(), String> {
    let clean = name.trim();
    if clean.len() < 2 || clean.len() > 48 {
        return Err("Device name must be 2–48 characters".into());
    }
    let mut inner = state.0.write().await;
    inner.config.identity.device_name = clean.into();
    save_config(&inner)
}

#[tauri::command]
async fn request_pairing(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let (message, address, peer, code) = {
        let inner = state.0.read().await;
        let p = inner
            .discovered
            .get(&peer_id)
            .cloned()
            .ok_or("Device is no longer visible")?;
        let own_pk = public_key(&inner.config.identity)?;
        let code = pair_code(&own_pk, &p.public_key);
        (
            WireMessage::PairRequest {
                device_id: inner.config.identity.device_id.clone(),
                device_name: inner.config.identity.device_name.clone(),
                public_key: own_pk,
                port: TCP_PORT,
            },
            p.address.clone(),
            p,
            code,
        )
    };
    let reply = send_to(&address, &message).await?;
    if !reply.ok {
        return Err(reply.reason);
    }
    state.0.write().await.pending.insert(
        peer_id,
        PendingPair {
            peer,
            code,
            direction: "outgoing".into(),
        },
    );
    Ok(())
}

#[tauri::command]
async fn approve_pairing(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let (message, address, stored) = {
        let inner = state.0.read().await;
        let p = inner
            .pending
            .get(&peer_id)
            .filter(|p| p.direction == "incoming")
            .cloned()
            .ok_or("Pairing request expired")?;
        let own_pk = public_key(&inner.config.identity)?;
        (
            WireMessage::PairAccept {
                device_id: inner.config.identity.device_id.clone(),
                device_name: inner.config.identity.device_name.clone(),
                public_key: own_pk,
                port: TCP_PORT,
            },
            p.peer.address.clone(),
            StoredPeer {
                id: p.peer.id.clone(),
                name: p.peer.name.clone(),
                public_key: p.peer.public_key.clone(),
                address: p.peer.address.clone(),
            },
        )
    };
    let reply = send_to(&address, &message).await?;
    if !reply.ok {
        return Err(reply.reason);
    }
    let mut inner = state.0.write().await;
    inner.config.peers.retain(|p| p.id != peer_id);
    inner.config.peers.push(stored);
    inner.pending.remove(&peer_id);
    save_config(&inner)
}

#[tauri::command]
async fn reject_pairing(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.0.write().await.pending.remove(&peer_id);
    Ok(())
}

#[tauri::command]
async fn forget_peer(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut inner = state.0.write().await;
    inner.config.peers.retain(|p| p.id != peer_id);
    inner.pending.remove(&peer_id);
    save_config(&inner)
}

#[tauri::command]
async fn delete_transfer(transfer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.0.write().await.inbox.retain(|t| t.id != transfer_id);
    Ok(())
}

#[tauri::command]
async fn send_text(
    peer_id: String,
    text: String,
    ttl_seconds: u64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    if text.trim().is_empty() {
        return Err("Enter text to send".into());
    }
    if text.as_bytes().len() > MAX_TEXT_BYTES {
        return Err("Text must be 32 KB or less".into());
    }
    if !matches!(ttl_seconds, 120 | 600 | 3600) {
        return Err("Invalid expiry".into());
    }
    let created = now_ms();
    let expires = created + ttl_seconds * 1000;
    let transfer_id = Uuid::new_v4().to_string();
    let (message, address, name) = {
        let inner = state.0.read().await;
        let peer = inner
            .config
            .peers
            .iter()
            .find(|p| p.id == peer_id)
            .ok_or("Device is not paired")?;
        let live = inner
            .discovered
            .get(&peer_id)
            .filter(|d| created - d.last_seen < 8_000)
            .ok_or("Device is offline")?;
        let (nonce, ciphertext) = encrypt(&inner.config.identity, &peer.public_key, &text)?;
        (
            WireMessage::Transfer {
                sender_id: inner.config.identity.device_id.clone(),
                transfer_id: transfer_id.clone(),
                nonce,
                ciphertext,
                created_at: created,
                expires_at: expires,
            },
            live.address.clone(),
            peer.name.clone(),
        )
    };
    let reply = send_to(&address, &message).await?;
    if !reply.ok {
        return Err(reply.reason);
    }
    state.0.write().await.sent.push(TransferView {
        id: transfer_id,
        peer_id,
        peer_name: name,
        text,
        created_at: created,
        expires_at: expires,
        status: "delivered".into(),
    });
    Ok(())
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show Clipboard LAN Bridge", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;
    TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Clipboard LAN Bridge")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("bridge.json");
            let config = load_config(path.clone());
            let _ = fs::create_dir_all(path.parent().unwrap_or_else(|| std::path::Path::new(".")));
            let inner = Inner {
                config,
                config_path: path,
                discovered: HashMap::new(),
                pending: HashMap::new(),
                inbox: vec![],
                sent: vec![],
                network_ready: false,
                network_error: None,
            };
            let shared = Arc::new(RwLock::new(inner));
            app.manage(AppState(shared.clone()));
            setup_tray(app.handle())?;
            tauri::async_runtime::spawn(run_network(shared));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_snapshot,
            set_device_name,
            request_pairing,
            approve_pairing,
            reject_pairing,
            forget_peer,
            delete_transfer,
            send_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running Clipboard LAN Bridge");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn encryption_round_trip_and_tamper_rejection() {
        let a = fresh_identity();
        let b = fresh_identity();
        let (a_nonce, a_box) =
            encrypt(&a, &public_key(&b).unwrap(), "https://example.com/a?b=1").unwrap();
        assert_eq!(
            decrypt(&b, &public_key(&a).unwrap(), &a_nonce, &a_box).unwrap(),
            "https://example.com/a?b=1"
        );
        let mut bad = B64.decode(&a_box).unwrap();
        bad[0] ^= 1;
        assert!(decrypt(&b, &public_key(&a).unwrap(), &a_nonce, &B64.encode(bad)).is_err());
    }
    #[test]
    fn pairing_code_is_symmetric() {
        assert_eq!(pair_code("key-a", "key-b"), pair_code("key-b", "key-a"));
    }
    #[test]
    fn oversized_payload_is_rejected() {
        let a = fresh_identity();
        let b = fresh_identity();
        assert!(encrypt(
            &a,
            &public_key(&b).unwrap(),
            &"x".repeat(MAX_TEXT_BYTES + 1)
        )
        .is_err());
    }
}
