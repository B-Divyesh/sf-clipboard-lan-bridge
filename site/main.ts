import "./styles.css";
import "./a11y";
import releaseManifest from "./release-manifest.json";

type Asset = { platform: string; arch?: string; kind?: string; url: string; sha256?: string };
type Manifest = { version: string; assets: Asset[]; release_state?: "draft" | "published" };
const releaseFallback = "https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest";
const scopedVerify = "https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify";
const licenseKey = "sb_license:clipboard-lan-bridge";
const verdictKey = "sb_license_verdict:clipboard-lan-bridge";

function platform(): "windows" | "macos" | "linux" {
  const value = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (value.includes("win")) return "windows";
  if (value.includes("mac")) return "macos";
  return "linux";
}

function preferredAsset(assets: Asset[], os: string): Asset | undefined {
  const matches = assets.filter(a => a.platform === os);
  if (os === "macos") {
    const arm = /arm|aarch64/i.test(`${navigator.userAgent} ${navigator.platform}`);
    return matches.find(a => a.arch === (arm ? "aarch64" : "x86_64") && a.kind === "dmg") || matches.find(a => a.kind === "dmg") || matches[0];
  }
  if (os === "windows") return matches.find(a => a.kind === "msi") || matches.find(a => a.kind === "exe") || matches[0];
  return matches.find(a => a.kind === "appimage") || matches.find(a => a.kind === "deb") || matches[0];
}

function loadRelease() {
  const os = platform(); const label = { windows: "Windows", macos: "macOS", linux: "Linux" }[os];
  const hero = document.querySelector<HTMLAnchorElement>("#hero-download")!;
  const main = document.querySelector<HTMLAnchorElement>("#main-download")!;
  const note = document.querySelector<HTMLElement>("#platform-note")!;
  const status = document.querySelector<HTMLElement>("#download-status")!;
  hero.textContent = `Download for ${label} ↓`; note.textContent = `${label} detected. Your operating system may show an unverified-publisher warning.`;
  try {
    const manifest = releaseManifest as Manifest;
    if (manifest.release_state === "draft") {
      hero.href = main.href = releaseFallback;
      main.textContent = "Downloads are being published";
      status.textContent = `The ${manifest.version} packages are being published. View the current release instead.`;
      return;
    }
    const asset = preferredAsset(manifest.assets, os);
    if (!asset) throw new Error(`no ${label} package in the current release`);
    hero.href = main.href = asset.url; main.textContent = `Download ${manifest.version} for ${label}`;
    const kind = asset.kind === "appimage" ? "Linux AppImage" : `${asset.kind || "Package"}`;
    status.replaceChildren(`${kind} · `);
    const verify = document.createElement("a");
    verify.href = "#verify-download";
    verify.textContent = "Verify this download";
    status.append(verify);
  } catch (error) {
    hero.href = main.href = releaseFallback; main.textContent = "View release downloads";
    status.textContent = `Automatic selection is unavailable (${String(error).replace("Error: ", "")}). Choose a package on GitHub Releases.`;
  }
}

function handleCheckoutReturn() {
  const token = new URLSearchParams(location.search).get("license");
  if (!token) return;
  const notice = document.querySelector<HTMLElement>("#license-return");
  const output = document.querySelector<HTMLTextAreaElement>("#license-token");
  if (!notice || !output) return;
  output.value = token;
  localStorage.setItem(licenseKey, token);
  localStorage.setItem(verdictKey, JSON.stringify({ checked_at: Date.now(), valid: true, reason: "pending verification" }));
  notice.hidden = false;
  history.replaceState({}, "", location.pathname + location.hash);
  void fetch(`${scopedVerify}?license=${encodeURIComponent(token)}`).then(async response => {
    const verdict = await response.json();
    localStorage.setItem(verdictKey, JSON.stringify({ checked_at: Date.now(), ...verdict }));
  }).catch(() => undefined);
}

document.querySelectorAll<HTMLButtonElement>("[data-copy-command]").forEach(button => button.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(button.dataset.copyCommand || ""); button.textContent = "Copied"; }
  catch { button.textContent = "Select command"; }
}));
if (new URLSearchParams(location.search).get("demo") === "1") location.replace("/demo/");
else { loadRelease(); handleCheckoutReturn(); }
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) void navigator.serviceWorker.register("/sw.js");
