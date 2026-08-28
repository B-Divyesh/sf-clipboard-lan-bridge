# Clipboard LAN Bridge — build handoff

## What shipped

- Tauri 2 desktop app for Linux, macOS, and Windows with a responsive, keyboard-operable interface and tray menu.
- LAN discovery over UDP broadcast (`38742`) and direct TCP delivery (`38741`).
- Explicit pairing with a symmetric six-character public-key fingerprint and receiver-side approval.
- X25519 shared-key agreement plus XChaCha20-Poly1305 authenticated encryption for every payload.
- Deliberate clipboard read/write actions only; UTF-8 text allowlist, 32 KB limit, 2/10/60 minute expiry, online/offline/error/empty states, transfer acknowledgement, delete, and forget-device controls.
- Local identity and paired public keys stored in the OS app-data directory. Transfer queues are memory-only and expire automatically. No relay, account, analytics, or telemetry.
- Optional $9 one-time Personal Route pass with Sociobot checkout, return-token storage, daily verification cache, restore field, and a genuinely useful two-device free route.
- Art-deco transit-poster visual system, generated original hero illustration and hand-authored route/device marks. Full provenance is in `.factory/design.md`.
- Responsive static site at `dist/site/`, OS-aware release selection, verified shell/PowerShell installers, privacy and terms pages, offline cache, and immutable asset cache policy. The browser uses GitHub's CORS-enabled latest-release API (and confirms `latest.json` is attached); command-line installers consume `latest.json` directly because GitHub's binary asset host does not expose it to browser JavaScript via CORS.
- GitHub Actions release matrix for Linux x86_64, Windows x86_64, macOS arm64, and macOS x86_64. It publishes `.AppImage`, `.deb`, `.rpm`, `.msi`, `.exe`, `.dmg`, `SHA256SUMS`, and `latest.json` via `softprops/action-gh-release`.

## Verification

Run from a clean checkout with Node 22+, Rust stable, and the Tauri 2 platform prerequisites:

```sh
npm ci
npm test
npm run build
npm run tauri build -- --bundles deb   # Linux smoke bundle
```

Verified on 2026-08-28:

- `npm test`: **pass** — 3 Vitest domain tests, 8 Playwright tests across desktop Chromium and a 393 px mobile profile, 3 Rust tests (encryption round trip, tamper rejection, symmetric pairing code, and payload cap).
- Playwright + axe-core: **0 serious/critical violations** on the landing site and app empty/offline state; no console errors; legal routes and mobile overflow checked.
- `npm run build`: **pass** — app output at `dist/app/index.html`; deploy output at `dist/site/index.html`.
- JavaScript/CSS: app 14.33 KB JS / 9.09 KB CSS raw; site 3.19 KB JS / 8.14 KB CSS raw. Hero WebP is 32 KB mobile / 65 KB desktop.
- Lighthouse mobile against the production preview: **Performance 100, Accessibility 100, FCP 0.9 s, LCP 1.7 s, CLS 0, TBT 0 ms**.
- Native Linux packaging: **pass** — the v0.1.0 smoke package built successfully before the icon-only v0.1.1 patch.
- GitHub release: **v0.1.2 passed** — all four matrix builds and the publish job completed successfully. The release contains seven native packages: Linux `.AppImage`/`.deb`/`.rpm`, Windows `.msi`/`.exe`, and arm64/x86_64 macOS `.dmg`, plus `SHA256SUMS` and valid `latest.json`.
- Release checksum: downloaded `linux-x86_64-Clipboard.LAN.Bridge_0.1.2_amd64.deb`; computed SHA-256 `01f73780daa6a9b2883acb605c76c65b0a8c78a0b64464ad7bbe24eeaa6488ad`, exactly matching `latest.json` and `SHA256SUMS`.
- Installer smoke test: `site/public/install.sh` resolved v0.1.2, downloaded the 75 MB AppImage, verified its checksum, marked it executable, and installed it into an isolated `XDG_BIN_HOME`.

## Known gaps

- The researched opportunity includes phones, but this orchestrated v1 build target is Tauri desktop and the required release matrix contains desktop operating systems only. The site states this plainly. Android/iOS companions require platform local-network permissions, foreground/background policy work, signing, and store distribution; none is simulated by the website.
- Broadcast discovery can be blocked by guest Wi-Fi client isolation, host firewalls, or VPN routing. The app reports that state and does not fall back to a cloud relay.
- Pairing and same-LAN transfer are covered by crypto/domain tests and a compiled native package, but the disposable build container does not provide two independently routed GUI hosts for a physical two-device acceptance test.
- Active transfer queues are intentionally memory-only in v1, so quitting the receiving app clears arrivals before their expiry.

## Needs operator action

- Register the production paid product for slug `clipboard-lan-bridge` and ensure its return URL is `https://clipboard-lan-bridge.sociobot.in`.
- Deploy exactly `dist/site/` at `https://clipboard-lan-bridge.sociobot.in`.
- The shipped v1 packages are unsigned and the site says so. To sign/notarize later, add Apple signing/notarization secrets (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) and Windows Authenticode secrets (`WINDOWS_CERT_PFX`, `WINDOWS_CERT_PASSWORD`), then update the workflow signing steps.
- Build Android/iOS companions before claiming phone support.
