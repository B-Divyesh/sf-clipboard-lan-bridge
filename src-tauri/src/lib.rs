#![cfg_attr(not(feature = "desktop"), allow(dead_code))]

use aes_gcm::{Aes256Gcm, Nonce as AesNonce};
use axum::{
    extract::{ConnectInfo, Query, State as AxumState},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use p256::{
    ecdh::diffie_hellman, elliptic_curve::sec1::ToEncodedPoint, PublicKey as MobilePublicKey,
    SecretKey as MobileSecretKey,
};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
#[cfg(feature = "desktop")]
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
const FREE_PEER_LIMIT: usize = 1;
const MOBILE_PORT: u16 = 38_743;
/// Every LAN companion route shares this per-client allowance. It keeps a
/// misbehaving phone page from turning the desktop app into a LAN request
/// amplifier while leaving normal status polling comfortably below the cap.
const MOBILE_API_ALLOWANCE: usize = 30;
const MOBILE_API_WINDOW: Duration = Duration::from_secs(10);

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Identity {
    device_id: String,
    device_name: String,
    secret: String,
    #[serde(default = "fresh_mobile_secret")]
    mobile_secret: String,
}

fn desktop_kind() -> String {
    "desktop".into()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredLicense {
    token: String,
    valid: bool,
    reason: String,
    checked_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredPeer {
    id: String,
    name: String,
    public_key: String,
    address: String,
    #[serde(default = "desktop_kind")]
    kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredConfig {
    identity: Identity,
    #[serde(default)]
    peers: Vec<StoredPeer>,
    #[serde(default)]
    license: Option<StoredLicense>,
}

#[derive(Debug, Clone, Serialize)]
struct PeerView {
    id: String,
    name: String,
    address: String,
    online: bool,
    paired: bool,
    last_seen: u64,
    kind: String,
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
    licensed: bool,
    license_reason: String,
    companion_urls: Vec<String>,
}

#[derive(Debug, Clone)]
struct DiscoveredPeer {
    id: String,
    name: String,
    public_key: String,
    address: String,
    last_seen: u64,
    kind: String,
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
    mobile_outbox: HashMap<String, Vec<MobileEnvelope>>,
}

#[derive(Clone, Default)]
struct CompanionRateLimiter {
    clients: Arc<Mutex<HashMap<IpAddr, CompanionRateWindow>>>,
}

struct CompanionRateWindow {
    started: Instant,
    requests: usize,
}

impl CompanionRateLimiter {
    /// Returns the whole-second `Retry-After` value when this client has used
    /// its allowance in the current window.
    fn retry_after(&self, client: IpAddr) -> Option<u64> {
        let now = Instant::now();
        let mut clients = self.clients.lock().expect("companion rate limiter lock");
        clients.retain(|_, entry| now.duration_since(entry.started) < MOBILE_API_WINDOW);
        let entry = clients
            .entry(client)
            .or_insert_with(|| CompanionRateWindow {
                started: now,
                requests: 0,
            });
        if entry.requests >= MOBILE_API_ALLOWANCE {
            let remaining = MOBILE_API_WINDOW.saturating_sub(now.duration_since(entry.started));
            return Some(
                remaining
                    .as_secs()
                    .saturating_add(u64::from(remaining.subsec_nanos() > 0))
                    .max(1),
            );
        }
        entry.requests += 1;
        None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MobileEnvelope {
    sender_id: String,
    transfer_id: String,
    nonce: String,
    ciphertext: String,
    created_at: u64,
    expires_at: u64,
}

#[derive(Debug, Deserialize)]
struct MobilePairRequest {
    device_id: String,
    device_name: String,
    public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct MobilePairResponse {
    code: String,
    desktop_public_key: String,
}

#[derive(Debug, Deserialize)]
struct MobileQuery {
    device_id: String,
}

#[derive(Debug, Serialize)]
struct MobileStatus {
    paired: bool,
    desktop_name: String,
    licensed: bool,
}

#[derive(Debug, Deserialize)]
struct MobileSend {
    device_id: String,
    transfer: MobileEnvelope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LicenseVerdict {
    valid: bool,
    reason: String,
    #[serde(default)]
    expires_at: Option<String>,
}

#[cfg(feature = "desktop")]
struct AppState(Arc<RwLock<Inner>>);

#[derive(Debug, Clone, Serialize, Deserialize)]
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

fn fresh_mobile_secret() -> String {
    B64.encode(MobileSecretKey::random(&mut OsRng).to_bytes())
}

fn fresh_identity() -> Identity {
    let secret = StaticSecret::random_from_rng(OsRng);
    let suffix = &Uuid::new_v4().simple().to_string()[..4];
    Identity {
        device_id: Uuid::new_v4().to_string(),
        device_name: format!("Bridge {suffix}"),
        secret: B64.encode(secret.to_bytes()),
        mobile_secret: fresh_mobile_secret(),
    }
}

fn load_config(path: PathBuf) -> StoredConfig {
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| StoredConfig {
            identity: fresh_identity(),
            peers: vec![],
            license: None,
        })
}

fn has_valid_license(inner: &Inner) -> bool {
    inner
        .config
        .license
        .as_ref()
        .is_some_and(|license| license.valid)
}

fn can_add_peer(inner: &Inner, peer_id: &str) -> bool {
    inner.config.peers.iter().any(|peer| peer.id == peer_id)
        || has_valid_license(inner)
        || inner.config.peers.len() < FREE_PEER_LIMIT
}

fn can_use_ttl(inner: &Inner, ttl_seconds: u64) -> bool {
    matches!(ttl_seconds, 120 | 600) || (ttl_seconds == 3600 && has_valid_license(inner))
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
    XChaCha20Poly1305::new_from_slice(&key).map_err(|_| "Encryption setup failed".to_string())
}

fn transfer_aad(sender_id: &str, transfer_id: &str, created_at: u64, expires_at: u64) -> Vec<u8> {
    format!("clipboard-lan-bridge-v2|{sender_id}|{transfer_id}|{created_at}|{expires_at}")
        .into_bytes()
}

fn encrypt(
    identity: &Identity,
    peer_key: &str,
    text: &str,
    sender_id: &str,
    transfer_id: &str,
    created_at: u64,
    expires_at: u64,
) -> Result<(String, String), String> {
    if text.len() > MAX_TEXT_BYTES {
        return Err("Text must be 32 KB or less".into());
    }
    let mut nonce = [0u8; 24];
    OsRng.fill_bytes(&mut nonce);
    let ciphertext = cipher(identity, peer_key)?
        .encrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: text.as_bytes(),
                aad: &transfer_aad(sender_id, transfer_id, created_at, expires_at),
            },
        )
        .map_err(|_| "Encryption failed".to_string())?;
    Ok((B64.encode(nonce), B64.encode(ciphertext)))
}

#[allow(clippy::too_many_arguments)]
fn decrypt(
    identity: &Identity,
    peer_key: &str,
    nonce: &str,
    ciphertext: &str,
    sender_id: &str,
    transfer_id: &str,
    created_at: u64,
    expires_at: u64,
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
        .decrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: encrypted.as_ref(),
                aad: &transfer_aad(sender_id, transfer_id, created_at, expires_at),
            },
        )
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

fn mobile_public_key(identity: &Identity) -> Result<String, String> {
    let secret_bytes = B64
        .decode(&identity.mobile_secret)
        .map_err(|_| "Invalid phone companion identity")?;
    let secret = MobileSecretKey::from_slice(&secret_bytes)
        .map_err(|_| "Invalid phone companion identity")?;
    Ok(B64.encode(secret.public_key().to_encoded_point(false).as_bytes()))
}

fn mobile_cipher(identity: &Identity, peer_key: &str) -> Result<Aes256Gcm, String> {
    let secret_bytes = B64
        .decode(&identity.mobile_secret)
        .map_err(|_| "Invalid phone companion identity")?;
    let secret = MobileSecretKey::from_slice(&secret_bytes)
        .map_err(|_| "Invalid phone companion identity")?;
    let public_bytes = B64.decode(peer_key).map_err(|_| "Invalid phone key")?;
    let public =
        MobilePublicKey::from_sec1_bytes(&public_bytes).map_err(|_| "Invalid phone key")?;
    let shared = diffie_hellman(secret.to_nonzero_scalar(), public.as_affine());
    let key = Sha256::digest(
        [
            b"clipboard-lan-bridge-mobile-v1".as_slice(),
            shared.raw_secret_bytes().as_slice(),
        ]
        .concat(),
    );
    Aes256Gcm::new_from_slice(&key).map_err(|_| "Phone encryption setup failed".into())
}

fn mobile_encrypt(
    identity: &Identity,
    peer_key: &str,
    text: &str,
    envelope: &MobileEnvelope,
) -> Result<MobileEnvelope, String> {
    if text.len() > MAX_TEXT_BYTES {
        return Err("Text must be 32 KB or less".into());
    }
    let mut nonce = [0u8; 12];
    OsRng.fill_bytes(&mut nonce);
    let aad = transfer_aad(
        &envelope.sender_id,
        &envelope.transfer_id,
        envelope.created_at,
        envelope.expires_at,
    );
    let ciphertext = mobile_cipher(identity, peer_key)?
        .encrypt(
            AesNonce::from_slice(&nonce),
            Payload {
                msg: text.as_bytes(),
                aad: &aad,
            },
        )
        .map_err(|_| "Phone encryption failed")?;
    Ok(MobileEnvelope {
        nonce: B64.encode(nonce),
        ciphertext: B64.encode(ciphertext),
        ..envelope.clone()
    })
}

fn mobile_decrypt(
    identity: &Identity,
    peer_key: &str,
    envelope: &MobileEnvelope,
) -> Result<String, String> {
    let nonce: [u8; 12] = B64
        .decode(&envelope.nonce)
        .map_err(|_| "Invalid phone nonce")?
        .try_into()
        .map_err(|_| "Invalid phone nonce")?;
    let ciphertext = B64
        .decode(&envelope.ciphertext)
        .map_err(|_| "Invalid phone ciphertext")?;
    let aad = transfer_aad(
        &envelope.sender_id,
        &envelope.transfer_id,
        envelope.created_at,
        envelope.expires_at,
    );
    let clear = mobile_cipher(identity, peer_key)?
        .decrypt(
            AesNonce::from_slice(&nonce),
            Payload {
                msg: &ciphertext,
                aad: &aad,
            },
        )
        .map_err(|_| "Phone message authentication failed")?;
    if clear.len() > MAX_TEXT_BYTES {
        return Err("Transfer exceeds 32 KB".into());
    }
    String::from_utf8(clear).map_err(|_| "Only UTF-8 text is accepted".into())
}

fn mobile_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"));
    headers
}

async fn mobile_home() -> impl IntoResponse {
    (mobile_headers(), Html(include_str!("mobile.html")))
}
async fn mobile_script() -> impl IntoResponse {
    (
        mobile_headers(),
        [(header::CONTENT_TYPE, "text/javascript; charset=utf-8")],
        include_str!("mobile.js"),
    )
}
async fn mobile_style() -> impl IntoResponse {
    (
        mobile_headers(),
        [(header::CONTENT_TYPE, "text/css; charset=utf-8")],
        include_str!("mobile.css"),
    )
}

async fn mobile_pair(
    AxumState(shared): AxumState<Arc<RwLock<Inner>>>,
    Json(request): Json<MobilePairRequest>,
) -> Result<Json<MobilePairResponse>, (StatusCode, String)> {
    let name = request.device_name.trim();
    if request.device_id.len() < 8
        || request.device_id.len() > 64
        || name.len() < 2
        || name.len() > 48
    {
        return Err((
            StatusCode::BAD_REQUEST,
            "Use a valid phone name and identity.".into(),
        ));
    }
    MobilePublicKey::from_sec1_bytes(
        &B64.decode(&request.public_key)
            .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid phone key.".into()))?,
    )
    .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid phone key.".into()))?;
    let mut inner = shared.write().await;
    let own_key = mobile_public_key(&inner.config.identity)
        .map_err(|error| (StatusCode::INTERNAL_SERVER_ERROR, error))?;
    let peer = DiscoveredPeer {
        id: request.device_id.clone(),
        name: name.into(),
        public_key: request.public_key.clone(),
        address: "Phone companion".into(),
        last_seen: now_ms(),
        kind: "mobile".into(),
    };
    let code = pair_code(&own_key, &request.public_key);
    inner
        .discovered
        .insert(request.device_id.clone(), peer.clone());
    if !inner
        .config
        .peers
        .iter()
        .any(|saved| saved.id == request.device_id)
    {
        inner.pending.insert(
            request.device_id,
            PendingPair {
                peer,
                code: code.clone(),
                direction: "incoming".into(),
            },
        );
    }
    Ok(Json(MobilePairResponse {
        code,
        desktop_public_key: own_key,
    }))
}

async fn mobile_status(
    AxumState(shared): AxumState<Arc<RwLock<Inner>>>,
    Query(query): Query<MobileQuery>,
) -> Json<MobileStatus> {
    let mut inner = shared.write().await;
    if let Some(peer) = inner.discovered.get_mut(&query.device_id) {
        peer.last_seen = now_ms();
    }
    Json(MobileStatus {
        paired: inner
            .config
            .peers
            .iter()
            .any(|peer| peer.id == query.device_id && peer.kind == "mobile"),
        desktop_name: inner.config.identity.device_name.clone(),
        licensed: has_valid_license(&inner),
    })
}

async fn mobile_send(
    AxumState(shared): AxumState<Arc<RwLock<Inner>>>,
    Json(request): Json<MobileSend>,
) -> Result<Json<WireReply>, (StatusCode, String)> {
    if request.transfer.sender_id != request.device_id
        || request.transfer.expires_at <= now_ms()
        || request.transfer.expires_at > request.transfer.created_at + 3_600_000
    {
        return Err((
            StatusCode::BAD_REQUEST,
            "Transfer expiry or identity is invalid.".into(),
        ));
    }
    let mut inner = shared.write().await;
    let peer = inner
        .config
        .peers
        .iter()
        .find(|peer| peer.id == request.device_id && peer.kind == "mobile")
        .cloned()
        .ok_or((
            StatusCode::FORBIDDEN,
            "Approve this phone in the desktop app first.".into(),
        ))?;
    if request.transfer.expires_at > request.transfer.created_at + 600_000
        && !has_valid_license(&inner)
    {
        return Err((
            StatusCode::PAYMENT_REQUIRED,
            "One-hour tickets are not available on the free route.".into(),
        ));
    }
    let text = mobile_decrypt(&inner.config.identity, &peer.public_key, &request.transfer)
        .map_err(|error| (StatusCode::BAD_REQUEST, error))?;
    inner.inbox.retain(|ticket| ticket.expires_at > now_ms());
    if !inner
        .inbox
        .iter()
        .any(|ticket| ticket.id == request.transfer.transfer_id)
    {
        inner.inbox.push(TransferView {
            id: request.transfer.transfer_id,
            peer_id: peer.id,
            peer_name: peer.name,
            text,
            created_at: request.transfer.created_at,
            expires_at: request.transfer.expires_at,
            status: "received".into(),
        });
    }
    if let Some(seen) = inner.discovered.get_mut(&request.device_id) {
        seen.last_seen = now_ms();
    }
    Ok(Json(WireReply {
        ok: true,
        reason: "accepted".into(),
    }))
}

async fn mobile_inbox(
    AxumState(shared): AxumState<Arc<RwLock<Inner>>>,
    Query(query): Query<MobileQuery>,
) -> Result<Json<Vec<MobileEnvelope>>, (StatusCode, String)> {
    let mut inner = shared.write().await;
    if !inner
        .config
        .peers
        .iter()
        .any(|peer| peer.id == query.device_id && peer.kind == "mobile")
    {
        return Err((
            StatusCode::FORBIDDEN,
            "Approve this phone in the desktop app first.".into(),
        ));
    }
    if let Some(seen) = inner.discovered.get_mut(&query.device_id) {
        seen.last_seen = now_ms();
    }
    let now = now_ms();
    let outbox = inner.mobile_outbox.entry(query.device_id).or_default();
    outbox.retain(|item| item.expires_at > now);
    Ok(Json(outbox.clone()))
}

async fn limit_companion_requests(
    AxumState(limiter): AxumState<CompanionRateLimiter>,
    ConnectInfo(remote): ConnectInfo<SocketAddr>,
    request: axum::extract::Request,
    next: Next,
) -> Response {
    if let Some(retry_after) = limiter.retry_after(remote.ip()) {
        let mut response = (
            StatusCode::TOO_MANY_REQUESTS,
            "Too many companion requests. Wait before trying again.",
        )
            .into_response();
        response.headers_mut().insert(
            header::RETRY_AFTER,
            HeaderValue::from_str(&retry_after.to_string())
                .expect("positive retry-after seconds are valid headers"),
        );
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        return response;
    }
    next.run(request).await
}

fn companion_router(shared: Arc<RwLock<Inner>>) -> Router {
    Router::new()
        .route("/", get(mobile_home))
        .route("/mobile.js", get(mobile_script))
        .route("/mobile.css", get(mobile_style))
        .route("/api/pair", post(mobile_pair))
        .route("/api/status", get(mobile_status))
        .route("/api/send", post(mobile_send))
        .route("/api/inbox", get(mobile_inbox))
        .with_state(shared)
        .layer(middleware::from_fn_with_state(
            CompanionRateLimiter::default(),
            limit_companion_requests,
        ))
}

async fn run_mobile_server(shared: Arc<RwLock<Inner>>) {
    let app = companion_router(shared);
    if let Ok(listener) = tokio::net::TcpListener::bind(("0.0.0.0", MOBILE_PORT)).await {
        let _ = axum::serve(
            listener,
            app.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .await;
    }
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
                kind: "desktop".into(),
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
            if !can_add_peer(&inner, &device_id) {
                return Err("The free route connects this device to one other device.".into());
            }
            let stored = StoredPeer {
                id: device_id.clone(),
                name: device_name,
                public_key: pk,
                address: format!("{remote_ip}:{port}"),
                kind: "desktop".into(),
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
            let received_at = now_ms();
            if created_at > received_at + 30_000
                || expires_at <= received_at
                || expires_at > created_at + 3_600_000
            {
                return Err("Transfer expiry is invalid".into());
            }
            let mut inner = shared.write().await;
            if expires_at > created_at + 600_000 && !has_valid_license(&inner) {
                return Err("One-hour tickets are not available on the free route".into());
            }
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
                &sender_id,
                &transfer_id,
                created_at,
                expires_at,
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
    tokio::spawn(async move {
        loop {
            if let Ok((stream, remote)) = listener.accept().await {
                let state = accept_state.clone();
                tokio::spawn(async move {
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
    tokio::spawn(async move {
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
                            kind: "desktop".into(),
                        },
                    );
                }
            }
        }
    }
}

#[cfg(feature = "desktop")]
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
                    kind: p.kind.clone(),
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
            kind: d.kind.clone(),
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
        licensed: has_valid_license(&inner),
        license_reason: inner
            .config
            .license
            .as_ref()
            .map_or_else(|| "not_checked".into(), |license| license.reason.clone()),
        companion_urls: local_ip_address::list_afinet_netifas()
            .map(|addresses| {
                addresses
                    .into_iter()
                    .filter_map(|(_, ip)| match ip {
                        IpAddr::V4(value) if !value.is_loopback() => {
                            Some(format!("http://{value}:{MOBILE_PORT}"))
                        }
                        _ => None,
                    })
                    .collect()
            })
            .unwrap_or_default(),
    })
}

#[cfg(feature = "desktop")]
async fn fetch_license_verdict(token: &str) -> Result<LicenseVerdict, String> {
    let response = reqwest::Client::new()
        .get("https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify")
        .query(&[("license", token)])
        .timeout(Duration::from_secs(8))
        .send()
        .await
        .map_err(|_| "Could not reach the license service")?;
    if !response.status().is_success() {
        return Err("License service is unavailable".into());
    }
    response
        .json::<LicenseVerdict>()
        .await
        .map_err(|_| "License service returned an invalid response".into())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn verify_license(
    token: String,
    state: State<'_, AppState>,
) -> Result<LicenseVerdict, String> {
    let token = token.trim();
    if token.len() < 8 || token.len() > 4096 {
        return Err("Paste a valid license token".into());
    }
    let verdict = fetch_license_verdict(token).await?;
    let mut inner = state.0.write().await;
    inner.config.license = Some(StoredLicense {
        token: token.into(),
        valid: verdict.valid,
        reason: verdict.reason.clone(),
        checked_at: now_ms(),
    });
    save_config(&inner)?;
    Ok(verdict)
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn remove_license(state: State<'_, AppState>) -> Result<(), String> {
    let mut inner = state.0.write().await;
    inner.config.license = None;
    save_config(&inner)
}

#[cfg(feature = "desktop")]
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

#[cfg(feature = "desktop")]
#[tauri::command]
async fn request_pairing(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let (message, address, peer, code) = {
        let inner = state.0.read().await;
        let p = inner
            .discovered
            .get(&peer_id)
            .cloned()
            .ok_or("Device is no longer visible")?;
        if p.kind != "desktop" {
            return Err("Approve phone requests from the incoming pairing card.".into());
        }
        if !can_add_peer(&inner, &peer_id) {
            return Err("The free route connects this device to one other device.".into());
        }
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

#[cfg(feature = "desktop")]
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
        if !can_add_peer(&inner, &peer_id) {
            return Err("The free route connects this device to one other device.".into());
        }
        let own_pk = public_key(&inner.config.identity)?;
        (
            if p.peer.kind == "mobile" {
                None
            } else {
                Some(WireMessage::PairAccept {
                    device_id: inner.config.identity.device_id.clone(),
                    device_name: inner.config.identity.device_name.clone(),
                    public_key: own_pk,
                    port: TCP_PORT,
                })
            },
            p.peer.address.clone(),
            StoredPeer {
                id: p.peer.id.clone(),
                name: p.peer.name.clone(),
                public_key: p.peer.public_key.clone(),
                address: p.peer.address.clone(),
                kind: p.peer.kind.clone(),
            },
        )
    };
    if let Some(message) = message {
        let reply = send_to(&address, &message).await?;
        if !reply.ok {
            return Err(reply.reason);
        }
    }
    let mut inner = state.0.write().await;
    inner.config.peers.retain(|p| p.id != peer_id);
    inner.config.peers.push(stored);
    inner.pending.remove(&peer_id);
    save_config(&inner)
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn reject_pairing(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.0.write().await.pending.remove(&peer_id);
    Ok(())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn forget_peer(peer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut inner = state.0.write().await;
    inner.config.peers.retain(|p| p.id != peer_id);
    inner.pending.remove(&peer_id);
    save_config(&inner)
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn delete_transfer(transfer_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.0.write().await.inbox.retain(|t| t.id != transfer_id);
    Ok(())
}

#[cfg(feature = "desktop")]
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
    if text.len() > MAX_TEXT_BYTES {
        return Err("Text must be 32 KB or less".into());
    }
    if !matches!(ttl_seconds, 120 | 600 | 3600) {
        return Err("Invalid expiry".into());
    }
    let created = now_ms();
    let expires = created + ttl_seconds * 1000;
    let transfer_id = Uuid::new_v4().to_string();
    let (message, address, name, mobile) = {
        let inner = state.0.read().await;
        if !can_use_ttl(&inner, ttl_seconds) {
            return Err("One-hour tickets are not available on the free route".into());
        }
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
        if peer.kind == "mobile" {
            let envelope = MobileEnvelope {
                sender_id: inner.config.identity.device_id.clone(),
                transfer_id: transfer_id.clone(),
                nonce: String::new(),
                ciphertext: String::new(),
                created_at: created,
                expires_at: expires,
            };
            let encrypted =
                mobile_encrypt(&inner.config.identity, &peer.public_key, &text, &envelope)?;
            (
                None,
                live.address.clone(),
                peer.name.clone(),
                Some(encrypted),
            )
        } else {
            let (nonce, ciphertext) = encrypt(
                &inner.config.identity,
                &peer.public_key,
                &text,
                &inner.config.identity.device_id,
                &transfer_id,
                created,
                expires,
            )?;
            (
                Some(WireMessage::Transfer {
                    sender_id: inner.config.identity.device_id.clone(),
                    transfer_id: transfer_id.clone(),
                    nonce,
                    ciphertext,
                    created_at: created,
                    expires_at: expires,
                }),
                live.address.clone(),
                peer.name.clone(),
                None,
            )
        }
    };
    if let Some(message) = message {
        let reply = send_to(&address, &message).await?;
        if !reply.ok {
            return Err(reply.reason);
        }
    } else if let Some(envelope) = mobile {
        state
            .0
            .write()
            .await
            .mobile_outbox
            .entry(peer_id.clone())
            .or_default()
            .push(envelope);
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

#[cfg(feature = "desktop")]
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

#[cfg(feature = "desktop")]
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
                mobile_outbox: HashMap::new(),
            };
            let shared = Arc::new(RwLock::new(inner));
            app.manage(AppState(shared.clone()));
            setup_tray(app.handle())?;
            tauri::async_runtime::spawn(run_network(shared));
            let companion_state = app.state::<AppState>().0.clone();
            tauri::async_runtime::spawn(run_mobile_server(companion_state));
            let license_state = app.state::<AppState>().0.clone();
            tauri::async_runtime::spawn(async move {
                let stale = {
                    let inner = license_state.read().await;
                    inner
                        .config
                        .license
                        .as_ref()
                        .filter(|license| license.checked_at + 86_400_000 <= now_ms())
                        .map(|license| license.token.clone())
                };
                if let Some(token) = stale {
                    if let Ok(verdict) = fetch_license_verdict(&token).await {
                        let mut inner = license_state.write().await;
                        inner.config.license = Some(StoredLicense {
                            token,
                            valid: verdict.valid,
                            reason: verdict.reason,
                            checked_at: now_ms(),
                        });
                        let _ = save_config(&inner);
                    }
                }
            });
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
            send_text,
            verify_license,
            remove_license
        ])
        .run(tauri::generate_context!())
        .expect("error while running Clipboard LAN Bridge");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_inner(identity: Identity) -> Inner {
        Inner {
            config: StoredConfig {
                identity,
                peers: vec![],
                license: None,
            },
            config_path: std::env::temp_dir()
                .join(format!("clipboard-lan-bridge-{}.json", Uuid::new_v4())),
            discovered: HashMap::new(),
            pending: HashMap::new(),
            inbox: vec![],
            sent: vec![],
            network_ready: true,
            network_error: None,
            mobile_outbox: HashMap::new(),
        }
    }

    async fn exchange(message: WireMessage, state: Arc<RwLock<Inner>>) -> WireReply {
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let address = listener.local_addr().unwrap();
        let receiver = tokio::spawn(async move {
            let (stream, remote) = listener.accept().await.unwrap();
            let _ = handle_connection(stream, remote, state).await;
        });
        let mut stream = TcpStream::connect(address).await.unwrap();
        let reply = write_message(&mut stream, &message).await.unwrap();
        receiver.await.unwrap();
        reply
    }

    #[test]
    // @claim:end-to-end-encryption
    fn transfer_metadata_is_authenticated() {
        let a = fresh_identity();
        let b = fresh_identity();
        let created = 1_800_000_000_000;
        let expires = created + 120_000;
        let (a_nonce, a_box) = encrypt(
            &a,
            &public_key(&b).unwrap(),
            "https://example.com/a?b=1",
            &a.device_id,
            "transfer-1",
            created,
            expires,
        )
        .unwrap();
        assert_eq!(
            decrypt(
                &b,
                &public_key(&a).unwrap(),
                &a_nonce,
                &a_box,
                &a.device_id,
                "transfer-1",
                created,
                expires
            )
            .unwrap(),
            "https://example.com/a?b=1"
        );
        assert!(decrypt(
            &b,
            &public_key(&a).unwrap(),
            &a_nonce,
            &a_box,
            &a.device_id,
            "replayed-id",
            created,
            expires
        )
        .is_err());
        assert!(decrypt(
            &b,
            &public_key(&a).unwrap(),
            &a_nonce,
            &a_box,
            &a.device_id,
            "transfer-1",
            created,
            expires + 60_000
        )
        .is_err());
        let mut bad = B64.decode(&a_box).unwrap();
        bad[0] ^= 1;
        assert!(decrypt(
            &b,
            &public_key(&a).unwrap(),
            &a_nonce,
            &B64.encode(bad),
            &a.device_id,
            "transfer-1",
            created,
            expires
        )
        .is_err());
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
            &"x".repeat(MAX_TEXT_BYTES + 1),
            &a.device_id,
            "too-large",
            1,
            121_000
        )
        .is_err());
    }

    #[tokio::test]
    // @claim:phone-companion
    async fn phone_companion_crypto_round_trip() {
        let state = Arc::new(RwLock::new(test_inner(fresh_identity())));
        let desktop = state.read().await.config.identity.clone();
        let phone = fresh_identity();
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let address = listener.local_addr().unwrap();
        let server_state = state.clone();
        let server = tokio::spawn(async move {
            axum::serve(
                listener,
                companion_router(server_state).into_make_service_with_connect_info::<SocketAddr>(),
            )
            .await
            .unwrap();
        });
        let client = reqwest::Client::new();
        let base = format!("http://{address}");
        let page = client.get(format!("{base}/")).send().await.unwrap();
        assert_eq!(page.status(), StatusCode::OK);
        assert!(page.text().await.unwrap().contains("Connect this phone"));
        let script = client
            .get(format!("{base}/mobile.js"))
            .send()
            .await
            .unwrap();
        assert_eq!(script.status(), StatusCode::OK);
        assert!(script.text().await.unwrap().contains("/api/pair"));
        let phone_public = mobile_public_key(&phone).unwrap();
        let pair = client
            .post(format!("{base}/api/pair"))
            .json(&serde_json::json!({
                "device_id": phone.device_id.clone(),
                "device_name": "Kitchen phone",
                "public_key": phone_public
            }))
            .send()
            .await
            .unwrap();
        assert_eq!(pair.status(), StatusCode::OK);
        let pair: MobilePairResponse = pair.json().await.unwrap();
        assert_eq!(
            pair.code,
            pair_code(&mobile_public_key(&desktop).unwrap(), &phone_public)
        );
        {
            let mut inner = state.write().await;
            let pending = inner.pending.remove(&phone.device_id).unwrap();
            assert_eq!(pending.code, pair.code);
            inner.config.peers.push(StoredPeer {
                id: pending.peer.id,
                name: pending.peer.name,
                public_key: pending.peer.public_key,
                address: pending.peer.address,
                kind: "mobile".into(),
            });
        }
        let created = now_ms();
        let template = MobileEnvelope {
            sender_id: phone.device_id.clone(),
            transfer_id: "phone-transfer".into(),
            nonce: String::new(),
            ciphertext: String::new(),
            created_at: created,
            expires_at: created + 120_000,
        };
        let encrypted = mobile_encrypt(
            &phone,
            &pair.desktop_public_key,
            "Train arrives at 18:20",
            &template,
        )
        .unwrap();
        let sent = client
            .post(format!("{base}/api/send"))
            .json(&serde_json::json!({
                "device_id": phone.device_id.clone(),
                "transfer": encrypted.clone()
            }))
            .send()
            .await
            .unwrap();
        assert_eq!(sent.status(), StatusCode::OK);
        assert_eq!(state.read().await.inbox[0].text, "Train arrives at 18:20");

        let outbound_template = MobileEnvelope {
            sender_id: desktop.device_id.clone(),
            transfer_id: "desktop-transfer".into(),
            nonce: String::new(),
            ciphertext: String::new(),
            created_at: created,
            expires_at: created + 120_000,
        };
        let outbound = mobile_encrypt(
            &desktop,
            &phone_public,
            "Meet at the library",
            &outbound_template,
        )
        .unwrap();
        state
            .write()
            .await
            .mobile_outbox
            .insert(phone.device_id.clone(), vec![outbound.clone()]);
        let inbox: Vec<MobileEnvelope> = client
            .get(format!("{base}/api/inbox?device_id={}", phone.device_id))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(
            mobile_decrypt(&phone, &pair.desktop_public_key, &inbox[0]).unwrap(),
            "Meet at the library"
        );
        let mut tampered = encrypted.clone();
        tampered.expires_at += 60_000;
        assert!(mobile_decrypt(&desktop, &phone_public, &tampered).is_err());
        server.abort();
    }

    #[tokio::test]
    // @claim:companion-api-allowance
    async fn phone_companion_enforces_a_documented_per_client_allowance() {
        let state = Arc::new(RwLock::new(test_inner(fresh_identity())));
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            axum::serve(
                listener,
                companion_router(state).into_make_service_with_connect_info::<SocketAddr>(),
            )
            .await
            .unwrap();
        });

        let client = reqwest::Client::new();
        let status_url =
            format!("http://{address}/api/status?device_id=allowance-regression-device");
        for _ in 0..MOBILE_API_ALLOWANCE {
            assert_eq!(
                client.get(&status_url).send().await.unwrap().status(),
                StatusCode::OK
            );
        }
        let limited = client.get(&status_url).send().await.unwrap();
        assert_eq!(limited.status(), StatusCode::TOO_MANY_REQUESTS);
        let retry_after = limited
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.parse::<u64>().ok());
        assert!(retry_after.is_some_and(|seconds| seconds > 0));
        server.abort();
    }

    #[test]
    // @claim:app-data-boundary
    fn app_data_persists_identity_peers_and_license_but_not_tickets() {
        let mut inner = test_inner(fresh_identity());
        let config_path = inner.config_path.clone();
        let identity_id = inner.config.identity.device_id.clone();
        inner.config.peers.push(StoredPeer {
            id: "paired-phone".into(),
            name: "Kitchen phone".into(),
            public_key: "fixture-peer-key".into(),
            address: "Phone companion".into(),
            kind: "mobile".into(),
        });
        inner.config.license = Some(StoredLicense {
            token: "fixture-license-token".into(),
            valid: true,
            reason: "ok".into(),
            checked_at: now_ms(),
        });
        inner.inbox.push(TransferView {
            id: "memory-only-inbox-ticket".into(),
            peer_id: "paired-phone".into(),
            peer_name: "Kitchen phone".into(),
            text: "This ticket must not persist".into(),
            created_at: now_ms(),
            expires_at: now_ms() + 120_000,
            status: "received".into(),
        });
        inner.sent.push(TransferView {
            id: "memory-only-sent-ticket".into(),
            peer_id: "paired-phone".into(),
            peer_name: "Kitchen phone".into(),
            text: "This sent ticket must not persist".into(),
            created_at: now_ms(),
            expires_at: now_ms() + 120_000,
            status: "sent".into(),
        });

        save_config(&inner).unwrap();
        let written = fs::read_to_string(&config_path).unwrap();
        let saved: StoredConfig = serde_json::from_str(&written).unwrap();
        assert_eq!(saved.identity.device_id, identity_id);
        assert_eq!(saved.peers[0].public_key, "fixture-peer-key");
        assert_eq!(saved.license.unwrap().token, "fixture-license-token");
        assert!(!written.contains("memory-only-inbox-ticket"));
        assert!(!written.contains("memory-only-sent-ticket"));
        assert!(!written.contains("\"inbox\""));
        assert!(!written.contains("\"sent\""));
        fs::remove_file(config_path).unwrap();
    }

    #[test]
    // @claim:two-device-free-tier
    fn free_and_paid_limits_are_enforced_in_native_state() {
        let mut inner = test_inner(fresh_identity());
        assert!(can_add_peer(&inner, "first"));
        assert!(!can_use_ttl(&inner, 3600));
        inner.config.peers.push(StoredPeer {
            id: "first".into(),
            name: "Phone".into(),
            public_key: "key".into(),
            address: "phone".into(),
            kind: "mobile".into(),
        });
        assert!(!can_add_peer(&inner, "second"));
        inner.config.license = Some(StoredLicense {
            token: "fixture-license".into(),
            valid: true,
            reason: "ok".into(),
            checked_at: now_ms(),
        });
        assert!(can_add_peer(&inner, "second"));
        inner.config.peers.push(StoredPeer {
            id: "second".into(),
            name: "Laptop".into(),
            public_key: "key-two".into(),
            address: "laptop".into(),
            kind: "desktop".into(),
        });
        assert!(can_add_peer(&inner, "third"));
        inner.config.peers.push(StoredPeer {
            id: "third".into(),
            name: "Tablet".into(),
            public_key: "key-three".into(),
            address: "tablet".into(),
            kind: "desktop".into(),
        });
        assert!(can_add_peer(&inner, "fourth"));
        assert!(can_use_ttl(&inner, 3600));
        inner.config.license.as_mut().unwrap().valid = false;
        assert!(!can_add_peer(&inner, "second"));
    }

    #[tokio::test]
    // @claim:explicit-pairing
    // @claim:lan-only
    async fn pair_send_receive_replay_and_expire_lifecycle() {
        let sender = fresh_identity();
        let receiver = fresh_identity();
        let sender_state = Arc::new(RwLock::new(test_inner(sender.clone())));
        let receiver_state = Arc::new(RwLock::new(test_inner(receiver.clone())));
        {
            let mut inner = sender_state.write().await;
            let peer = DiscoveredPeer {
                id: receiver.device_id.clone(),
                name: "Office computer".into(),
                public_key: public_key(&receiver).unwrap(),
                address: "127.0.0.1:1".into(),
                last_seen: now_ms(),
                kind: "desktop".into(),
            };
            inner.pending.insert(
                receiver.device_id.clone(),
                PendingPair {
                    code: pair_code(
                        &public_key(&sender).unwrap(),
                        &public_key(&receiver).unwrap(),
                    ),
                    peer,
                    direction: "outgoing".into(),
                },
            );
        }
        assert!(
            exchange(
                WireMessage::PairRequest {
                    device_id: sender.device_id.clone(),
                    device_name: "Studio laptop".into(),
                    public_key: public_key(&sender).unwrap(),
                    port: TCP_PORT,
                },
                receiver_state.clone(),
            )
            .await
            .ok
        );
        // A request is visible but not usable until the receiving device has
        // explicitly approved the same pairing code.
        let pending_created = now_ms();
        let (pending_nonce, pending_ciphertext) = encrypt(
            &sender,
            &public_key(&receiver).unwrap(),
            "This must be rejected before approval",
            &sender.device_id,
            "pending-transfer",
            pending_created,
            pending_created + 120_000,
        )
        .unwrap();
        assert!(
            !exchange(
                WireMessage::Transfer {
                    sender_id: sender.device_id.clone(),
                    transfer_id: "pending-transfer".into(),
                    nonce: pending_nonce,
                    ciphertext: pending_ciphertext,
                    created_at: pending_created,
                    expires_at: pending_created + 120_000,
                },
                receiver_state.clone(),
            )
            .await
            .ok
        );
        assert!(receiver_state.read().await.inbox.is_empty());
        {
            let mut inner = receiver_state.write().await;
            let pending = inner.pending.remove(&sender.device_id).unwrap();
            assert_eq!(
                pending.code,
                pair_code(
                    &public_key(&receiver).unwrap(),
                    &public_key(&sender).unwrap()
                )
            );
            inner.config.peers.push(StoredPeer {
                id: pending.peer.id,
                name: pending.peer.name,
                public_key: pending.peer.public_key,
                address: pending.peer.address,
                kind: "desktop".into(),
            });
        }
        assert!(
            exchange(
                WireMessage::PairAccept {
                    device_id: receiver.device_id.clone(),
                    device_name: "Office computer".into(),
                    public_key: public_key(&receiver).unwrap(),
                    port: TCP_PORT
                },
                sender_state
            )
            .await
            .ok
        );
        let created = now_ms();
        let expires = created + 120_000;
        let transfer_id = "lifecycle-transfer";
        let (nonce, ciphertext) = encrypt(
            &sender,
            &public_key(&receiver).unwrap(),
            "Copy this exact arrival",
            &sender.device_id,
            transfer_id,
            created,
            expires,
        )
        .unwrap();
        let message = WireMessage::Transfer {
            sender_id: sender.device_id.clone(),
            transfer_id: transfer_id.into(),
            nonce,
            ciphertext,
            created_at: created,
            expires_at: expires,
        };
        assert!(exchange(message.clone(), receiver_state.clone()).await.ok);
        assert!(exchange(message, receiver_state.clone()).await.ok);
        let mut inner = receiver_state.write().await;
        assert_eq!(inner.inbox.len(), 1);
        assert_eq!(inner.inbox[0].text, "Copy this exact arrival");
        inner.inbox[0].expires_at = now_ms() - 1;
        inner.inbox.retain(|ticket| ticket.expires_at > now_ms());
        assert!(inner.inbox.is_empty());
    }
}
