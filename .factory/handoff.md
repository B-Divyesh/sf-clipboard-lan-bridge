# Clipboard LAN Bridge — repair handoff

## Result

All release-blocking findings from independent verification commit `5ebb23c5401ec64b67451fb75bac32684be17898` are repaired in version 0.1.3.

## What changed

- Added the required claim registry and claim-tagged browser, Node, and native regression coverage.
- Added `/demo/` with realistic sample transfers, a persistent demo banner, reset/exit actions, and isolated `demo:` session storage.
- Rewrote the first screen in plain words and kept both primary actions visible at desktop and 390 px.
- Added a self-hosted phone companion served by the desktop app on the LAN. Phone pairing requires desktop approval of the same six-character code. Phone transfers use P-256 key agreement and AES-256-GCM.
- Moved license verification and cached verdicts into Rust. Native pairing, incoming approval, and one-hour expiry now enforce the free/pass gates. Checkout returns expose a copyable token for the installed app.
- Bound sender, transfer ID, creation time, and expiry into AEAD associated data. Duplicate transfer IDs and changed metadata are rejected.
- Fixed the Route pass contrast, 44 px targets, 200% text reflow, route focus/title announcements, copy feedback, and reduced-motion behavior.
- Added CSP, canonical/social metadata, icons, crawler files, a real 404 response policy, and offline cache coverage without offline GitHub API errors.
- Added the `CI=1` Tauri wrapper, pinned compatible Playwright/Axe versions, and excluded native build output from Vite watchers.

## Local verification evidence

Run from a clean checkout:

```sh
npm ci
npm run check
npm test
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
CI=1 npm run tauri build -- --bundles deb
```

Observed on 2026-08-30:

- `npm ci`: pass; 67 packages audited; 0 vulnerabilities.
- `npm run check`: pass; TypeScript and Cargo check.
- `npm test`: pass; 3 Vitest, 1 release-policy test, 30 Playwright desktop/mobile executions, and 6 Rust tests.
- Browser coverage: desktop and 390 px, keyboard focus, 200% text, serious/critical Axe findings, privacy request log, offline reload, 404/CSP policy, demo isolation, license handoff, and clipboard actions.
- Native lifecycle: real loopback sockets cover pair → approve → send → receive → replay rejection → expiry rejection.
- Native phone smoke: local companion returned HTTP 200, displayed one `h1`, produced a six-character code, logged no console errors, and had zero serious/critical Axe findings at 390×844.
- `npm run build`: pass; `dist/app/` and `dist/site/` produced. Initial app JS is 14.80 KB raw; site JS is 3.64 KB raw; CSS is below 11 KB per entry; social image is 44.81 KB.
- Clippy with warnings denied: pass.
- `CI=1 npm run tauri build -- --bundles deb`: pass; produced `Clipboard LAN Bridge_0.1.3_amd64.deb`.
- Worker `verify-url.sh`: pass; title, `lang`, one `h1`, main landmark, alt text, and zero console errors at desktop/390 px.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, TBT 0 ms, CLS 0.

## Release and deployment

Release and live deployment evidence is appended after the v0.1.3 workflow and production upload complete.

## Needs operator action

Release packages remain unsigned. Signing requires owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`; users currently receive the documented operating-system warning.

## Known gaps

No product-function gaps are known. The phone companion requires the phone and desktop to remain on the same LAN, as designed.
