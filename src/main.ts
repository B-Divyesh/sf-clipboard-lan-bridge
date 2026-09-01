import { invoke } from "@tauri-apps/api/core";
import "./styles.css";
import "./contrast.css";
import { FREE_DEVICE_LIMIT, MAX_TEXT_BYTES, byteLength, remainingLabel, summarize, validateTransfer } from "./domain";

type Peer = {
  id: string;
  name: string;
  address: string;
  online: boolean;
  paired: boolean;
  last_seen: number;
};

type Pairing = { peer_id: string; peer_name: string; code: string; direction: "incoming" | "outgoing" };
type Transfer = { id: string; peer_id: string; peer_name: string; text: string; created_at: number; expires_at: number; status: string };
type Snapshot = {
  device_id: string;
  device_name: string;
  network_ready: boolean;
  network_error: string | null;
  peers: Peer[];
  pairings: Pairing[];
  inbox: Transfer[];
  sent: Transfer[];
  licensed: boolean;
  license_reason: string;
  companion_urls: string[];
};

const empty: Snapshot = {
  device_id: "browser-preview",
  device_name: "This device",
  network_ready: false,
  network_error: "Open the installed app to discover devices on your LAN.",
  peers: [], pairings: [], inbox: [], sent: [], licensed: false, license_reason: "not_checked", companion_urls: []
};

let state: Snapshot = empty;
let selectedPeer = "";
let refreshTimer = 0;
const isTauri = "__TAURI_INTERNALS__" in window;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="#send" aria-label="Clipboard LAN Bridge home">
        <svg class="brand-mark" aria-hidden="true" viewBox="0 0 48 48"><path d="M7 38V16h8V8h18v8h8v22H7Z"/><path d="M16 38V20h16v18M20 15h8"/></svg>
        <span>Clipboard <b>LAN Bridge</b></span>
      </a>
      <div class="network-state" id="network-state" role="status"><span class="status-dot"></span><span>Starting route…</span></div>
      <div class="sr-only" id="route-announcer" aria-live="polite"></div>
    </header>

    <nav class="rail-nav" aria-label="Main navigation">
      <a href="#send" data-view="send" aria-current="page"><span aria-hidden="true">↗</span> Send</a>
      <a href="#receive" data-view="receive"><span aria-hidden="true">↓</span> Receive <span class="count" id="inbox-count">0</span></a>
      <a href="#devices" data-view="devices"><span aria-hidden="true">◇</span> Devices</a>
      <a href="#pass" data-view="pass"><span aria-hidden="true">✦</span> Route pass</a>
    </nav>

    <main id="main" tabindex="-1">
      <section class="view active" id="view-send" aria-labelledby="send-title">
        <div class="eyebrow">Platform 01 · dispatch</div>
        <h1 id="send-title" tabindex="-1">Send a ticket</h1>
        <p class="lede">Move one short piece of text to one nearby device. Nothing is watched or synced in the background.</p>

        <form id="send-form" novalidate>
          <div class="field-head"><label for="payload">Text or link</label><button class="text-button" id="read-clipboard" type="button">Paste from clipboard</button></div>
          <textarea id="payload" rows="7" maxlength="32768" aria-describedby="payload-help payload-error" placeholder="Type or paste the text you want to hand off"></textarea>
          <div class="field-meta"><span id="payload-help">Text only · 32 KB maximum · never read automatically</span><span id="byte-count">0 / 32 KB</span></div>
          <p class="form-error" id="payload-error" role="alert"></p>

          <fieldset>
            <legend>Destination</legend>
            <div id="destination-list" class="destination-list"></div>
          </fieldset>

          <div class="dispatch-row">
            <label for="expiry">Expires after
              <select id="expiry">
                <option value="120">2 minutes</option>
                <option value="600" selected>10 minutes</option>
                <option value="3600" data-paid>1 hour · Route pass</option>
              </select>
            </label>
            <button class="primary-button" type="submit">Send securely <span aria-hidden="true">→</span></button>
          </div>
          <div id="send-result" class="notice" role="status" aria-live="polite" hidden></div>
        </form>
      </section>

      <section class="view" id="view-receive" aria-labelledby="receive-title" hidden>
        <div class="eyebrow">Platform 02 · arrivals</div>
        <h2 id="receive-title" tabindex="-1">Received tickets</h2>
        <p class="lede">Items disappear when their sender’s expiry time arrives.</p>
        <div id="inbox-list" class="ticket-list"></div>
      </section>

      <section class="view" id="view-devices" aria-labelledby="devices-title" hidden>
        <div class="eyebrow">Local route board</div>
        <h2 id="devices-title" tabindex="-1">Nearby devices</h2>
        <p class="lede">Both devices must be on the same LAN. Compare the code, then approve on the receiving device.</p>
        <section class="phone-connect" aria-labelledby="phone-title"><h3 id="phone-title">Connect a phone</h3><p>Open one of these local addresses on a phone connected to the same Wi-Fi:</p><div id="companion-links"></div></section>
        <div id="pairing-list"></div>
        <div id="device-list" class="device-list"></div>
        <details class="settings-panel">
          <summary>Device identity</summary>
          <form id="name-form"><label for="device-name">Name visible on your LAN</label><div class="inline-form"><input id="device-name" required maxlength="48"><button type="submit" class="secondary-button">Save name</button></div></form>
        </details>
      </section>

      <section class="view" id="view-pass" aria-labelledby="pass-title" hidden>
        <div class="eyebrow">Optional one-time pass</div>
        <h2 id="pass-title" tabindex="-1">Route pass</h2>
        <p class="lede">The free route connects two devices with ten-minute expiry. A $9 one-time pass adds unlimited paired devices and one-hour tickets.</p>
        <div class="pass-ticket">
          <div><span class="stamp">Personal route pass</span><strong id="license-state">Free route active</strong><p>No subscription. Safety controls and accessibility are always included.</p></div>
          <p class="checkout-status" role="status">Checkout is temporarily unavailable. Paste an existing license below.</p>
        </div>
        <form id="license-form" class="license-form"><label for="license-token">Have a license? Paste it here</label><div class="inline-form"><input id="license-token" type="password" autocomplete="off"><button class="secondary-button" type="submit">Verify license</button></div><p id="license-result" role="status"></p></form><button id="remove-license" class="text-button" type="button">Remove license from this device</button>
        <p class="legal-note">Sociobot/Dodo is the merchant of record. <a href="https://clipboard-lan-bridge.sociobot.in/privacy">Privacy</a> · <a href="https://clipboard-lan-bridge.sociobot.in/terms">Terms</a></p>
      </section>
    </main>

    <footer class="app-footer"><span>LAN only · end-to-end encrypted</span><span>Clipboard access is always deliberate</span></footer>
  </div>`;

function paid(): boolean {
  return state.licensed;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]!));
}

function render() {
  const status = $("#network-state");
  status.classList.toggle("online", state.network_ready);
  const statusText = state.network_ready ? "Local route open" : state.network_error || "Route offline";
  status.setAttribute("aria-label", statusText);
  status.innerHTML = `<span class="status-dot" aria-hidden="true"></span><span>${escapeHtml(statusText)}</span>`;
  $("#device-name").setAttribute("value", state.device_name);
  $("#inbox-count").textContent = String(state.inbox.length);
  $("#companion-links").innerHTML = state.companion_urls.length ? state.companion_urls.map(url => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`).join("") : `<p>The local phone address appears after the installed app joins a network.</p>`;

  const destinations = state.peers.filter(p => p.paired);
  $("#destination-list").innerHTML = destinations.length ? destinations.map(peer => `
    <label class="destination ${peer.online ? "" : "offline"}">
      <input type="radio" name="destination" value="${escapeHtml(peer.id)}" ${selectedPeer === peer.id ? "checked" : ""} ${peer.online ? "" : "disabled"}>
      <span class="device-symbol" aria-hidden="true">▣</span><span><strong>${escapeHtml(peer.name)}</strong><small>${peer.online ? "Nearby · encrypted route ready" : "Offline · last route unavailable"}</small></span>
    </label>`).join("") : `<div class="empty-state"><span class="empty-mark" aria-hidden="true">◇</span><strong>No paired destination yet</strong><p>Open Devices to pair with another Clipboard LAN Bridge on this Wi-Fi or Ethernet network.</p><a href="#devices" class="secondary-button">Find a device</a></div>`;

  $("#pairing-list").innerHTML = state.pairings.map(pairing => `<article class="pair-card"><div><span class="stamp">${pairing.direction === "incoming" ? "Approval requested" : "Waiting for approval"}</span><h3>${escapeHtml(pairing.peer_name)}</h3><p>Compare this code on both screens:</p><strong class="pair-code">${escapeHtml(pairing.code)}</strong></div>${pairing.direction === "incoming" ? `<div class="pair-actions"><button class="primary-button" data-approve="${escapeHtml(pairing.peer_id)}">Approve device</button><button class="text-button" data-reject="${escapeHtml(pairing.peer_id)}">Reject</button></div>` : ""}</article>`).join("");

  const canAdd = paid() || state.peers.filter(p => p.paired).length < FREE_DEVICE_LIMIT;
  $("#device-list").innerHTML = state.peers.length ? state.peers.map(peer => `<article class="device-row"><span class="device-symbol" aria-hidden="true">▣</span><div><h3>${escapeHtml(peer.name)}</h3><p>${peer.paired ? "Paired" : "Found on this LAN"} · ${peer.online ? "Online" : "Offline"}</p></div>${peer.paired ? `<button class="text-button danger" data-forget="${escapeHtml(peer.id)}">Forget</button>` : `<button class="secondary-button" data-pair="${escapeHtml(peer.id)}" ${canAdd ? "" : "disabled"}>${canAdd ? "Pair device" : "Pass required"}</button>`}</article>`).join("") : `<div class="empty-state"><span class="empty-mark" aria-hidden="true">⌁</span><strong>No other bridges found</strong><p>Keep the other app open on the same LAN. Guest Wi-Fi and VPNs can block discovery.</p></div>`;

  $("#inbox-list").innerHTML = state.inbox.length ? state.inbox.map(item => `<article class="clip-ticket"><div class="ticket-top"><span>From ${escapeHtml(item.peer_name)}</span><time>${remainingLabel(item.expires_at)}</time></div><p>${escapeHtml(item.text)}</p><div class="ticket-actions"><button class="secondary-button" data-copy="${escapeHtml(item.id)}">Copy text</button><button class="text-button danger" data-delete="${escapeHtml(item.id)}">Delete</button></div></article>`).join("") : `<div class="empty-state"><span class="empty-mark" aria-hidden="true">↓</span><strong>No arrivals</strong><p>Received text appears here only after a paired device deliberately sends it.</p></div>`;

  const unlocked = paid();
  $("#license-state").textContent = unlocked ? "Route pass active" : "Free route active";
  const hour = document.querySelector<HTMLOptionElement>("option[data-paid]")!;
  hour.disabled = !unlocked;
}

async function call<T>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!isTauri) throw new Error("This action is available in the installed app.");
  return invoke<T>(command, args);
}

async function refresh() {
  if (!isTauri) { render(); return; }
  try { state = await call<Snapshot>("get_snapshot"); } catch (error) { state = { ...empty, network_error: String(error) }; }
  render();
}

function showNotice(message: string, kind: "success" | "error" = "success") {
  const node = $("#send-result"); node.hidden = false; node.className = `notice ${kind}`; node.textContent = message;
}

async function verifyLicense(token: string) {
  const result = $("#license-result");
  if (!token.trim()) { result.textContent = "Paste a license token first."; return; }
  try {
    result.textContent = "Checking license…";
    const verdict = await call<{ valid: boolean; reason: string }>("verify_license", { token: token.trim() });
    result.textContent = verdict.valid ? "Route pass restored on this device." : "License no longer active. You can continue on the free route.";
  } catch { result.textContent = "Could not verify right now. Your current route remains available."; }
  await refresh();
}

function installLicenseReturn() {
  const url = new URL(location.href); const token = url.searchParams.get("license");
  if (token) { url.searchParams.delete("license"); history.replaceState({}, "", url); void verifyLicense(token); }
}

window.addEventListener("hashchange", activateView);
function activateView() {
  const view = location.hash.slice(1) || "send";
  document.querySelectorAll<HTMLElement>(".view").forEach(el => { const active = el.id === `view-${view}`; el.hidden = !active; el.classList.toggle("active", active); });
  document.querySelectorAll<HTMLAnchorElement>("[data-view]").forEach(a => a.setAttribute("aria-current", a.dataset.view === view ? "page" : "false"));
  const heading = document.querySelector<HTMLElement>(`#view-${view} h1, #view-${view} h2`);
  if (heading) { document.title = `${heading.textContent} — Clipboard LAN Bridge`; $("#route-announcer").textContent = heading.textContent || ""; heading.focus(); }
}

$("#payload").addEventListener("input", event => { $("#byte-count").textContent = `${byteLength((event.target as HTMLTextAreaElement).value).toLocaleString()} / 32 KB`; $("#payload-error").textContent = ""; });
$("#read-clipboard").addEventListener("click", async () => { try { $<HTMLTextAreaElement>("#payload").value = await navigator.clipboard.readText(); $("#payload").dispatchEvent(new Event("input")); } catch { $("#payload-error").textContent = "Clipboard access was not available. Paste with Ctrl/Cmd+V instead."; } });
$("#destination-list").addEventListener("change", event => { selectedPeer = (event.target as HTMLInputElement).value; });
$("#send-form").addEventListener("submit", async event => {
  event.preventDefault(); const text = $<HTMLTextAreaElement>("#payload").value; const error = validateTransfer(text);
  if (error) { $("#payload-error").textContent = error; $("#payload").focus(); return; }
  if (!selectedPeer) { $("#payload-error").textContent = "Choose an online destination."; return; }
  try { await call("send_text", { peerId: selectedPeer, text, ttlSeconds: Number($<HTMLSelectElement>("#expiry").value) }); showNotice(`Ticket sent: ${summarize(text, 52)}`); $<HTMLTextAreaElement>("#payload").value = ""; $("#payload").dispatchEvent(new Event("input")); await refresh(); }
  catch (error) { showNotice(String(error), "error"); }
});

document.body.addEventListener("click", async event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button"); if (!button) return;
  try {
    let refreshNeeded = false;
    if (button.dataset.pair) { await call("request_pairing", { peerId: button.dataset.pair }); refreshNeeded = true; }
    if (button.dataset.approve) { await call("approve_pairing", { peerId: button.dataset.approve }); refreshNeeded = true; }
    if (button.dataset.reject) { await call("reject_pairing", { peerId: button.dataset.reject }); refreshNeeded = true; }
    if (button.dataset.forget && confirm("Forget this device? You will need to compare a new code to reconnect.")) { await call("forget_peer", { peerId: button.dataset.forget }); refreshNeeded = true; }
    if (button.dataset.copy) { const item = state.inbox.find(x => x.id === button.dataset.copy); if (item) { await navigator.clipboard.writeText(item.text); button.textContent = "Copied"; } }
    if (button.dataset.delete) { await call("delete_transfer", { transferId: button.dataset.delete }); refreshNeeded = true; }
    if (refreshNeeded) await refresh();
  } catch (error) { showNotice(String(error), "error"); }
});

$("#name-form").addEventListener("submit", async event => { event.preventDefault(); try { await call("set_device_name", { name: $<HTMLInputElement>("#device-name").value }); await refresh(); } catch (error) { alert(String(error)); } });
$("#license-form").addEventListener("submit", event => { event.preventDefault(); const token = $<HTMLInputElement>("#license-token").value.trim(); void verifyLicense(token); });
$("#remove-license").addEventListener("click", async () => { try { await call("remove_license"); $("#license-result").textContent = "License removed from this device."; await refresh(); } catch (error) { $("#license-result").textContent = String(error); } });

installLicenseReturn(); activateView(); void refresh(); refreshTimer = window.setInterval(refresh, 2500);
window.addEventListener("beforeunload", () => clearInterval(refreshTimer));
