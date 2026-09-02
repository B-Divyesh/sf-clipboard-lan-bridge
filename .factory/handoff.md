# Clipboard LAN Bridge — repair 7 handoff

## Result

The release-blocking checkout finding is repaired without touching shared Sociobot billing resources. On 2026-09-02, a fresh request to `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. The product no longer promises a `$9` purchase or presents a checkout action.

The local product remains useful: it pairs one nearby device, sends encrypted text and links directly on the LAN, uses two- or ten-minute expiry, and has no account or cloud relay. Existing native license verification remains under Device settings for a person who already has a token, but it is not marketed as an available purchase.

## What changed

- Removed the paid card, `$9` language, purchase/merchant language, checkout-return handling, and checkout API allowance from landing, desktop, phone companion, legal pages, README, CSP, and copy audit.
- Reworked the desktop view to expose free-route limits plainly and put existing-token recovery under **Devices → Existing license**.
- Replaced the paid checkout claims with `@claim:no-dead-checkout-action`. Its Playwright regression visits landing, demo, privacy, terms, and 404 on desktop and 390 px; it asserts no purchase control, checkout URL, checkout copy, or scoped-checkout request.
- Prepared desktop release `v0.1.7` with a draft manifest. Until packages publish, the landing page deliberately shows **Downloads are being published** and links to the current release page.

## Verification

Executed from a clean dependency install on 2026-09-02:

```sh
npm ci
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

All passed. `npm test` covered 3 Vitest tests, 5 release/provenance tests, 44 Playwright checks across desktop and 390 px mobile, and 8 Rust protocol tests. All 19 commands declared in `.factory/claims.json` were also run independently and passed.

Local post-build checks passed for `/`, `/demo/`, `/privacy/`, and `/terms/` with `/opt/fleet/lib/verify-url.sh`; the pages had no console errors, specific titles, `lang="en"`, one h1, a main landmark, and complete image alt text. The Playwright Axe integration found zero serious or critical findings across the public routes in both viewports. Local Lighthouse recorded Performance 100, Accessibility 100, Best Practices 100, SEO 100, LCP 1.4 s, and CLS 0. Evidence is in `.factory/evidence/repair-7/`.

The static build produced 4.23 KB JavaScript (1.63 KB gzip) and 9.45 KB CSS (2.74 KB gzip) for the landing bundle; the 65.81 KB responsive hero remains under budget.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
npm run tauri dev
```

Visit `http://127.0.0.1:4173/demo/` after `npm run dev:site` to open the isolated sample flow.

## Release and deployment

- Release [`v0.1.7`](https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/tag/v0.1.7) was built by successful GitHub Actions run `33575551097` from `742a2aaa0f145033c2cd8d9ee3266169074cde22` for Linux, Windows, macOS arm64, and macOS x86_64.
- The workflow-produced `latest.json`, GitHub asset digests, and bundled `site/release-manifest.json` agree for all seven packages. A freshly streamed Linux DEB hash is `66cbf617812997dbd4b3f743c29ac01d5fccfe961fb297ad19ae499c41d3946c`.
- `dist/site` was deployed to the product-only Static Web App `sf-clipboard-lan-bridge` production environment. The custom domain <https://clipboard-lan-bridge.sociobot.in> serves the exact local `index.html` (SHA-256 `b0a445750eaa1cc166ff3eea36da40e71ffb4606262a0d696ef05e0b8ba1c0de`).
- Post-deploy `verify-url.sh` passed root, demo, privacy, and terms. A fresh live desktop and 390 px crawl found no checkout or purchase control, `$9`/checkout copy, overflow, console/page error, or off-origin request. Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s and CLS 0.

## Known gap

The researched one-time monetization is intentionally absent from this release because the product-scoped checkout endpoint is not registered. No shared billing or other Sociobot resource was accessed or changed. Registering a product and restoring payment would require a separate authorized work order and a full checkout-to-native-restore verification.
