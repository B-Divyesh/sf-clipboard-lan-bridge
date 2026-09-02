# Clipboard LAN Bridge — verification 10 handoff

## Result: PASS

Independent verification passed for candidate `5f9dea0b41666ff6da08f1dbea9b82f9c29b86e8` at <https://clipboard-lan-bridge.sociobot.in/>. No product code was changed. The full evidence and exact checks are in [verification-10.md](verification-10.md).

The candidate is documentation/evidence only after released runtime commit `a97c9fd` (v0.1.11); candidate-built site bundles were byte-identical to production. The live product delivers the explicit, local-only text/link handoff, a one-click isolated sample demo, and the desktop/phone companion flow described in the brief.

## Verification summary

- All 24 mandatory claim commands passed after `npm ci`.
- `npm test`, `npm run check`, `cargo fmt --check`, Clippy with warnings denied, and `npm run build` all passed.
- Live desktop and 390 px mobile checks passed: first-read copy, demo, keyboard focus, reduced motion, zero serious/critical Playwright axe issues, no console/page errors, and no horizontal overflow.
- Live request logs stayed same-origin. The PWA service worker controls, updates cleanly, and supports an offline reload. Security headers and caching policy passed review.
- Linux, macOS, and Windows release artifacts and SHA-256 metadata were independently checked. The companion endpoint allowance is 30 requests per client per 10 seconds, then `429` with `Retry-After`.

## Release history

## Changes

- Replaced the broken $9 checkout action and sale copy on the landing page, desktop app, README, and terms.
- Added a clear **New licenses are not available** state plus **Download to restore a license**.
- Preserved returned-token capture, native token verification, paid entitlements for existing holders, and token removal.
- Replaced the prior payment/refund claims with separate `purchase-unavailable` and `license-recovery` claims.
- Added an end-to-end test that requests the scoped checkout, observes its current error response, and proves no enabled product control points to it.
- Bumped the desktop and site to v0.1.11 and the offline cache to `clipboard-lan-bridge-v10`.
- Updated the catalog sentence and the complete copy audit.
- Recorded every earlier finding and its current evidence in `.factory/polish-3.md`.

## Release and deployment

- Repair source: `a97c9fdb3fb3e58640a16c17228b2db0081056ea`.
- Published manifest commit: `7874ea5`.
- Release: [v0.1.11](https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/tag/v0.1.11).
- GitHub Actions run: `33596532179`, successful.
- Release contents: Linux AppImage/deb/rpm, Windows exe/msi, macOS arm64/x64 dmg, `SHA256SUMS`, and `latest.json`.
- Release manifest source commit: `a97c9fdb3fb3e58640a16c17228b2db0081056ea`.
- Static deployment: `081119ea-e643-4cd9-b934-b2ec6f9aed88`.
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>.

## Historical verification (superseded by verification 10)

A fresh clone at `/tmp/clipboard-polish3-clean-HMATpP/repo` ran from commit `7874ea5` after `npm ci`:

- Every command in `.factory/claims.json` ran separately: 23/23 passed.
- `npm test`: passed 3 Vitest, 3 release, 52 Playwright, and 8 Rust tests.
- `npm run check`: passed TypeScript and Rust core checks.
- `npm run build`: passed and produced `dist/app/` plus `dist/site/`.
- Landing bundles: 2.05 KB gzip JS and 2.96 KB gzip CSS; desktop bundle: 5.59 KB gzip JS and 3.21 KB gzip CSS.

Live cold verification after deployment:

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200; an unknown path returns the designed 404 response.
- Every public route has its route-specific title, `lang=en`, one h1, a main landmark, complete image alt text, and no normal-load console errors.
- Axe found zero serious or critical issues at 390 px across every public route; no route overflowed horizontally.
- Landing and demo requests stayed on the product origin. Offline demo reload passed from `clipboard-lan-bridge-v10`.
- The demo entered in one click, wrote only its `demo:` session key, preserved a real-data sentinel, fully reset, cleared on exit, and moved focus correctly.
- The scoped checkout returned 404, while the live site exposed zero checkout targets and zero enabled Buy/Purchase controls.
- The Linux download selected the v0.1.11 AppImage; every crawled public link returned below 400.
- Live Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100; LCP 2,135 ms, CLS 0.002, total blocking time 27 ms.

Evidence is under `.factory/evidence/polish-3/`, including root/demo/legal/404 screenshots, worker URL reports, the interactive live demo capture, `live-check.json`, and Lighthouse JSON.

## Run and verify

```sh
npm ci
npm test
npm run check
npm run build
npm run dev:site
```

Open `http://127.0.0.1:4173/?demo=1` for an isolated sample. Run the desktop app with `npm run tauri dev` after installing the Tauri system prerequisites.

## Needs operator action

New-license sales must remain disabled until `clipboard-lan-bridge` is registered and enabled in the Sociobot billing service. After registration, reintroduce a product-scoped checkout control only with an end-to-end non-error checkout assertion. No product or deployment work remains for the current unavailable-sales state.

The v0.1.11 packages are unsigned. Signing a later release requires operator-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets; the current site gives only the tested unverified-publisher warning.
