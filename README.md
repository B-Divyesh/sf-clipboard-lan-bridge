# Clipboard LAN Bridge

Send short text and links between your own nearby devices. Packages are available for Linux, macOS, and Windows. Its phone page works in a phone browser on the same Wi-Fi.

Use it when you would otherwise message yourself a link, address, command, or short note.

## How pairing and encryption protect transfers

- Both devices display the same six-character pairing code. The receiving device must approve it before transfers can start.
- Transfers are encrypted after pairing. The app rejects a transfer if its ID or expiry time changes. It also rejects the same transfer a second time.
- Only valid UTF-8 text up to 32 KB is accepted. Free transfers expire after 2 or 10 minutes.
- Clipboard reads and writes happen only after you choose a button.
- The desktop app stores its identity, paired-device keys, and license on this computer. Active transfers stay in memory. Uninstall the app and remove its data to clear them.
- Keep the phone page open until the transfer arrives.
- The phone page accepts 30 requests from one network address every 10 seconds. After that, it asks the browser to wait before trying again (`429` with `Retry-After`).

This is a personal tool for your local network, not a password manager. Pair only on networks you trust and compare the displayed code.

## Run locally

Requirements: Node.js 22+, Rust stable, and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system.

```sh
npm ci
npm run tauri dev
```

Run the product site with `npm run dev:site`.

## Try the sample

Open `http://127.0.0.1:4173/?demo=1` after starting the site. The sample saves data only in this browser tab under a separate `demo:` key. It never writes sample transfers to app data.

In the installed app, choose **Load sample transfer**. The sample uses a separate `demo:` browser-session key and does not write app data.

## Test and build

```sh
npm test
npm run check
npm run build
```

Run `npm test` to check unit logic, browser accessibility, product claims, screen sizes, and local transfer behavior. Run `npm run build`; it creates the desktop app files in `dist/app/` and the website in `dist/site/`.

Build a local desktop package with the following command. On Linux, install these desktop build packages first:

```sh
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm
CI=true npm run tauri build
```

## Install and release

Your operating system may show an unverified-publisher warning. On macOS, right-click the app and choose **Open**. On Windows, confirm the publisher warning.

```sh
curl -fsSL https://clipboard-lan-bridge.sociobot.in/install.sh | sh
```

Windows PowerShell: `irm https://clipboard-lan-bridge.sociobot.in/install.ps1 | iex`

Packages and SHA-256 checksums are in the [latest release](https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest). The site bundles the current release manifest. Ordinary pages and the demo contact only this product website. A license-return page sends its token to Sociobot for verification.

## License and policy

The free plan connects this computer and one paired device. Existing licenses remove the paired-device limit and enable one-hour transfers. New licenses are not available.

Existing license holders can paste a token under **Existing license** in the desktop app. License terms are available at `/terms/`.

Code is MIT licensed; see [LICENSE](LICENSE). Product data practices are at `/privacy/`, and terms are at `/terms/`.
