import "./styles.css";
import "../a11y";

type Ticket = { id: string; from: string; text: string; expires: number };
const KEY = "demo:clipboard-lan-bridge:tickets";
const SAMPLE_TEXT = "Meet at Platform 4 at 18:20. The booking link is https://rail.example/BD7Q";
const SAMPLE_EXPIRY = "600";
const now = () => Number(sessionStorage.getItem("demo:clipboard-lan-bridge:now")) || (window as Window & { __clipboardDemoNow?: number }).__clipboardDemoNow || Date.now();
const sample = (): Ticket[] => [{ id: "sample-arrival", from: "Kitchen phone", text: "Groceries: oat milk, coriander, and AA batteries.", expires: now() + 600_000 }];
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

function load(): Ticket[] {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null") || sample(); }
  catch { return sample(); }
}

function save(tickets: Ticket[]) { sessionStorage.setItem(KEY, JSON.stringify(tickets)); }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!)); }

function render() {
  const tickets = load().filter(ticket => ticket.expires > now());
  save(tickets);
  $("#tickets").innerHTML = tickets.map(ticket => `<article class="ticket"><div><strong>From ${escapeHtml(ticket.from)}</strong><span>${Math.max(1, Math.ceil((ticket.expires - now()) / 60_000))}m left</span></div><p>${escapeHtml(ticket.text)}</p><button type="button" data-copy="${ticket.id}">Copy sample text</button></article>`).join("") || `<p class="empty">No sample arrivals. Reset the demo to load the sample again.</p>`;
}

$("#demo-text").addEventListener("input", event => {
  const bytes = new TextEncoder().encode((event.target as HTMLTextAreaElement).value).length;
  $("#demo-bytes").textContent = `${bytes.toLocaleString()} / 32 KB`;
  $("#demo-error").textContent = "";
});

$("#demo-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = $<HTMLTextAreaElement>("#demo-text");
  const bytes = new TextEncoder().encode(input.value).length;
  if (!input.value.trim()) { $("#demo-error").textContent = "Enter or paste something to send."; input.focus(); return; }
  if (bytes > 32_768) { $("#demo-error").textContent = "Text must be 32 KB or less."; input.focus(); return; }
  const ttl = Number($<HTMLSelectElement>("#demo-expiry").value) * 1000;
  const tickets = load();
  tickets.unshift({ id: crypto.randomUUID(), from: "Studio laptop", text: input.value, expires: now() + ttl });
  save(tickets);
  render();
  $("#arrivals-title").focus();
});

$("#tickets").addEventListener("click", async event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy]");
  if (!button) return;
  const ticket = load().find(item => item.id === button.dataset.copy);
  if (!ticket) return;
  try { await navigator.clipboard.writeText(ticket.text); button.textContent = "Sample text copied"; }
  catch { button.textContent = "Select the text above"; }
});

function resetDemo() {
  save(sample());
  const input = $<HTMLTextAreaElement>("#demo-text");
  input.value = SAMPLE_TEXT;
  $<HTMLSelectElement>("#demo-expiry").value = SAMPLE_EXPIRY;
  $("#demo-bytes").textContent = `${new TextEncoder().encode(SAMPLE_TEXT).length} / 32 KB`;
  $("#demo-error").textContent = "";
  render();
  input.focus();
}

$("#reset-demo").addEventListener("click", resetDemo);
$("#start-real").addEventListener("click", () => { sessionStorage.removeItem(KEY); });
if (!sessionStorage.getItem(KEY)) save(sample());
render();
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) void navigator.serviceWorker.register("/sw.js");
