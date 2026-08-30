import { gcm } from "@noble/ciphers/aes.js";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";

type Identity = { deviceId: string; privateKey: Uint8Array; publicKey: string };
type Envelope = { sender_id: string; transfer_id: string; nonce: string; ciphertext: string; created_at: number; expires_at: number };
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const ID_KEY = "clb:phone-identity";
const DESKTOP_KEY = "clb:desktop-public-key";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let identity: Identity;
let pollTimer = 0;

const toB64 = (bytes: Uint8Array) => { let value = ""; bytes.forEach(byte => value += String.fromCharCode(byte)); return btoa(value); };
const fromB64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
const aad = (item: Envelope) => encoder.encode(`clipboard-lan-bridge-v2|${item.sender_id}|${item.transfer_id}|${item.created_at}|${item.expires_at}`);

function loadIdentity(): Identity {
  const stored = localStorage.getItem(ID_KEY);
  if (stored) {
    const value = JSON.parse(stored) as { deviceId: string; privateKey: string; publicKey: string };
    return { ...value, privateKey: fromB64(value.privateKey) };
  }
  const privateKey = p256.utils.randomSecretKey();
  const value = { deviceId: randomId(), privateKey: toB64(privateKey), publicKey: toB64(p256.getPublicKey(privateKey, false)) };
  localStorage.setItem(ID_KEY, JSON.stringify(value));
  return { ...value, privateKey };
}

function cipherKey(): Uint8Array {
  const desktop = localStorage.getItem(DESKTOP_KEY);
  if (!desktop) throw new Error("Pair this phone first.");
  const sharedX = p256.getSharedSecret(identity.privateKey, fromB64(desktop), true).slice(1);
  const prefix = encoder.encode("clipboard-lan-bridge-mobile-v1");
  const combined = new Uint8Array(prefix.length + sharedX.length); combined.set(prefix); combined.set(sharedX, prefix.length);
  return sha256(combined);
}

function encrypt(text: string, ttl: number): Envelope {
  const created = Date.now();
  const item: Envelope = { sender_id: identity.deviceId, transfer_id: randomId(), created_at: created, expires_at: created + ttl * 1000, nonce: "", ciphertext: "" };
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  return { ...item, nonce: toB64(nonce), ciphertext: toB64(gcm(cipherKey(), nonce, aad(item)).encrypt(encoder.encode(text))) };
}

function decrypt(item: Envelope): string {
  return decoder.decode(gcm(cipherKey(), fromB64(item.nonce), aad(item)).decrypt(fromB64(item.ciphertext)));
}

async function status() {
  const response = await fetch(`/api/status?device_id=${encodeURIComponent(identity.deviceId)}`);
  const value = await response.json() as { paired: boolean; desktop_name: string; licensed: boolean };
  if (value.paired) {
    $("#pair-view").hidden = true; $("#send-view").hidden = false;
    $("#route-state").textContent = "Encrypted route ready";
    $("#paired-with").textContent = `Paired with ${value.desktop_name}. Both devices must stay on this local network.`;
    $<HTMLOptionElement>("#phone-hour").disabled = !value.licensed;
    await inbox();
  }
}

async function inbox() {
  if ($<HTMLElement>("#send-view").hidden) return;
  const response = await fetch(`/api/inbox?device_id=${encodeURIComponent(identity.deviceId)}`);
  if (!response.ok) return;
  const items = await response.json() as Envelope[];
  const node = $("#phone-inbox"); node.textContent = "";
  for (const item of items) {
    try {
      const text = decrypt(item); const article = document.createElement("article"); article.className = "ticket";
      const meta = document.createElement("small"); meta.textContent = `${Math.max(1, Math.ceil((item.expires_at - Date.now()) / 60_000))}m left`;
      const paragraph = document.createElement("p"); paragraph.textContent = text;
      const button = document.createElement("button"); button.type = "button"; button.textContent = "Copy text";
      button.addEventListener("click", async () => { try { await navigator.clipboard.writeText(text); button.textContent = "Copied"; } catch { paragraph.tabIndex = 0; paragraph.focus(); button.textContent = "Select the text above"; } });
      article.append(meta, paragraph, button); node.append(article);
    } catch { /* Invalid encrypted items are not shown. */ }
  }
  if (!items.length) { const empty = document.createElement("p"); empty.textContent = "No arrivals. Text sent from the computer appears here."; node.append(empty); }
}

$("#pair-phone").addEventListener("click", async () => {
  $("#pair-error").textContent = "";
  const name = $<HTMLInputElement>("#phone-name").value.trim();
  try {
    const response = await fetch("/api/pair", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device_id: identity.deviceId, device_name: name, public_key: identity.publicKey }) });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json() as { desktop_public_key: string; code: string }; localStorage.setItem(DESKTOP_KEY, result.desktop_public_key);
    const box = $("#pair-code"); box.hidden = false; box.innerHTML = "Compare this code in the desktop app:<strong></strong>Then choose Approve device there."; box.querySelector("strong")!.textContent = result.code;
  } catch (error) { $("#pair-error").textContent = String(error).replace("Error: ", ""); }
});

$("#send-form").addEventListener("submit", async event => {
  event.preventDefault(); const input = $<HTMLTextAreaElement>("#phone-text"); const text = input.value; const bytes = encoder.encode(text).length;
  if (!text.trim()) { $("#send-error").textContent = "Enter or paste something to send."; input.focus(); return; }
  if (bytes > 32_768) { $("#send-error").textContent = "Text must be 32 KB or less."; input.focus(); return; }
  try {
    const transfer = encrypt(text, Number($<HTMLSelectElement>("#phone-expiry").value));
    const response = await fetch("/api/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device_id: identity.deviceId, transfer }) });
    if (!response.ok) throw new Error(await response.text());
    input.value = ""; $("#send-error").textContent = "Sent to your computer.";
  } catch (error) { $("#send-error").textContent = String(error).replace("Error: ", ""); }
});

identity = loadIdentity();
await status();
pollTimer = window.setInterval(() => void status(), 2500);
addEventListener("beforeunload", () => clearInterval(pollTimer));
