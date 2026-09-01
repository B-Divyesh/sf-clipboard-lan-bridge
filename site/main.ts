import "./styles.css";
import "./a11y";

type Asset = { platform: string; arch?: string; kind?: string; url: string; sha256?: string };
type Manifest = { version: string; assets: Asset[] };
const releaseFallback = "https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest";

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

async function loadRelease() {
  const os = platform(); const label = { windows: "Windows", macos: "macOS", linux: "Linux" }[os];
  const hero = document.querySelector<HTMLAnchorElement>("#hero-download")!;
  const main = document.querySelector<HTMLAnchorElement>("#main-download")!;
  const note = document.querySelector<HTMLElement>("#platform-note")!;
  const status = document.querySelector<HTMLElement>("#download-status")!;
  hero.textContent = `Download for ${label} ↓`; note.textContent = `${label} detected · unsigned community build`;
  try {
    type Release = { tag_name: string; assets?: Array<{ name: string; browser_download_url: string }> };
    const cached = JSON.parse(localStorage.getItem("release:clipboard-lan-bridge") || "null") as { checkedAt: number; releases: Release[] } | null;
    let releases: Release[];
    if (cached && cached.checkedAt > Date.now() - 3_600_000) releases = cached.releases;
    else {
      if (!navigator.onLine) throw new Error("offline");
      const releaseResponse = await fetch("https://api.github.com/repos/B-Divyesh/sf-clipboard-lan-bridge/releases?per_page=1", { cache: "no-store" });
      if (!releaseResponse.ok) throw new Error("release manifest not published yet");
      releases = await releaseResponse.json() as Release[];
      localStorage.setItem("release:clipboard-lan-bridge", JSON.stringify({ checkedAt: Date.now(), releases }));
    }
    const release = releases[0];
    if (!release) throw new Error("release manifest not published yet");
    if (!release.assets?.some(asset => asset.name === "latest.json")) throw new Error("latest.json is not attached to the current release");
    const assets: Asset[] = release.assets.filter(asset => !["latest.json", "SHA256SUMS"].includes(asset.name)).map(asset => {
      const name = asset.name.toLowerCase();
      return {
        platform: name.startsWith("windows") ? "windows" : name.startsWith("macos") ? "macos" : "linux",
        arch: name.includes("aarch64") ? "aarch64" : "x86_64",
        kind: name.endsWith(".appimage") ? "appimage" : name.split(".").pop(),
        url: asset.browser_download_url
      };
    });
    const manifest: Manifest = { version: release.tag_name, assets }; const asset = preferredAsset(manifest.assets, os);
    if (!asset) throw new Error(`no ${label} package in the current release`);
    hero.href = main.href = asset.url; main.textContent = `Download ${manifest.version} for ${label}`;
    status.textContent = `${asset.kind?.toUpperCase() || "Package"} · checksum published in SHA256SUMS`;
  } catch (error) {
    hero.href = main.href = releaseFallback; main.textContent = "View release downloads";
    status.textContent = `Automatic selection is unavailable (${String(error).replace("Error: ", "")}). Choose a package on GitHub Releases.`;
  }
}

document.querySelectorAll<HTMLButtonElement>("[data-copy-command]").forEach(button => button.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(button.dataset.copyCommand || ""); button.textContent = "Copied"; }
  catch { button.textContent = "Select command"; }
}));

const url = new URL(location.href); const license = url.searchParams.get("license");
if (license) {
  localStorage.setItem("sb_license:clipboard-lan-bridge", license);
  url.searchParams.delete("license");
  history.replaceState({}, "", url);
  const panel = document.querySelector<HTMLElement>("#license-return")!;
  const value = document.querySelector<HTMLElement>("#returned-license")!;
  const feedback = document.querySelector<HTMLElement>("#license-feedback")!;
  const copyLicense = document.querySelector<HTMLButtonElement>("#copy-license")!;
  value.textContent = license;
  panel.hidden = false;
  copyLicense.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(license);
      copyLicense.textContent = "License copied";
      feedback.textContent = "License copied. Paste it in the desktop app under Route pass.";
    }
    catch {
      copyLicense.textContent = "Select the license above";
      feedback.textContent = "Clipboard access was unavailable. Select the license above and copy it manually.";
    }
  });
  document.querySelector<HTMLButtonElement>("#dismiss-license")!.addEventListener("click", () => { localStorage.removeItem("sb_license:clipboard-lan-bridge"); panel.hidden = true; });
}
void loadRelease();
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) void navigator.serviceWorker.register("/sw.js");
