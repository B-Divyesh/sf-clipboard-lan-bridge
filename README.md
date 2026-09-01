# Clipboard LAN Bridge

Clipboard LAN Bridge sends short text and links between your own nearby devices. The desktop app supports Linux, macOS, and Windows. Its built-in phone companion works in a phone browser on the same Wi-Fi.

Transfers use explicit code approval and authenticated device-to-device encryption. There is no cloud relay, account, clipboard watcher, file transfer, or telemetry.

## Who it is for

It is for people who message themselves just to move a URL, address, command, or short note between nearby devices.

## Safety model

- Discovery broadcasts a random device ID, chosen device name, public key, and local port.
- Both devices display the same six-character fingerprint. The receiving device must approve.
- Desktop peers use X25519 key agreement and XChaCha20-Poly1305 encryption.
- The phone companion uses P-256 key agreement and AES-256-GCM encryption.
- Transfer identity and expiry are authenticated. Replayed or changed metadata is rejected.
- Only valid UTF-8 text up to 32 KB is accepted. Free items expire after 2 or 10 minutes.
- Clipboard reads and writes happen only after a button press.
- Identities, peer keys, and any license token stay in the operating system app-data directory. Active tickets stay in memory.
- Keep the phone companion page open while sending. Phone browsers may pause background polling, so arrivals can wait until you return.
- The LAN companion allows 30 HTTP requests per client IP every 10 seconds. It replies with HTTP 429 and a `Retry-After` header until that window resets.

This is a personal LAN tool, not a password manager. Pair only on networks you trust and compare the displayed code.

## Run locally

Requirements: Node.js 22+, Rust stable, and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system.

```sh
npm ci
npm run tauri dev
```

Run the product site with `npm run dev:site`.

## Try the sample

Open `http://127.0.0.1:4173/demo/` after starting the site. The sample uses a separate `demo:` session-storage namespace. It never writes sample transfers to app data.

## Test and build

```sh
npm test
npm run check
npm run build
```

The test command runs unit, Chromium accessibility, claim, responsive, and native protocol tests. The build writes the desktop webview to `dist/app/` and the deployable site to `dist/site/`.

Build a local desktop package with the following command. On Linux, first install the same GUI toolchain used by the release workflow:

```sh
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm
CI=1 npm run tauri build
```

## Install and release

GitHub Actions builds packages for macOS, Windows, and Linux. All packages are unsigned. On macOS, right-click the app and choose **Open**. On Windows, confirm the publisher warning.

```sh
curl -fsSL https://clipboard-lan-bridge.sociobot.in/install.sh | sh
```

Windows PowerShell: `irm https://clipboard-lan-bridge.sociobot.in/install.ps1 | iex`

The installers read `latest.json` and verify SHA-256 before installing. The site bundles the current signed release manifest. Public page loads make no off-origin requests. Packages are also available from the [latest release](https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest).

## Deploy

Run `npm run build` to create the static site in `dist/site/`; the factory's static deployment publishes that directory from `main`. Push a version tag such as `v0.1.5` to build the unsigned macOS, Windows, and Linux installers in GitHub Actions. The release `latest.json` records the tag and exact source commit alongside package checksums. Copy that published file to `site/release-manifest.json` before the next site release.

## License and policy

Code is MIT licensed; see [LICENSE](LICENSE). Product data practices are at `/privacy/`, and purchase terms are at `/terms/`.

The free route connects the local device plus one peer. A $9 one-time Personal Route pass adds more peers and one-hour expiry. The shared checkout is temporarily unavailable, so the site does not offer a purchase action; existing licenses can still be restored in the app. Verification runs in the Rust core through the Sociobot billing API, so the installed app does not depend on browser CORS.
