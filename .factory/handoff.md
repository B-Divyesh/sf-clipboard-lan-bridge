# Clipboard LAN Bridge — repair 7 handoff

## Result

The release-blocking checkout finding is repaired without touching shared Sociobot billing resources. On 2026-09-02, a fresh request to `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. The product no longer promises a `$9` purchase or presents a checkout action.

The local product remains useful: it pairs one nearby device, sends encrypted text and links directly on the LAN, uses two- or ten-minute expiry, and has no account or cloud relay. Existing native license verification remains under Device settings for a person who already has a token, but it is not marketed as an available purchase.

## What changed

- Removed the paid card, `$9` language, purchase/merchant language, checkout-return handling, and checkout API allowance from landing, desktop, phone companion, legal pages, README, CSP, and copy audit.
- Reworked the desktop view to expose free-route limits plainly and put existing-token recovery under **Devices → Existing license**.
- Replaced the paid checkout claims with `@claim:no-dead-checkout-action`. Its Playwright regression visits landing, demo, privacy, terms, and 404 on desktop and 390 px; it asserts no purchase control, checkout URL, checkout copy, or scoped-checkout request.
- Prepared desktop release `v0.1.7` with a draft manifest. Until packages publish, the landing page deliberately shows **Downloads are being published** and links to the current release page.

## Verification before release

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

The static build produced 3.94 KB JavaScript (1.28 KB gzip) and 9.45 KB CSS (2.74 KB gzip) for the landing bundle; the 65.81 KB responsive hero remains under budget.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
npm run tauri dev
```

Visit `http://127.0.0.1:4173/demo/` after `npm run dev:site` to open the isolated sample flow.

## Release and deployment status

The next action is to commit this repair, push the `v0.1.7` tag for the existing GitHub Actions matrix, replace the draft `site/release-manifest.json` with the workflow-produced `latest.json`, then deploy `dist/site` to the product-scoped static resource. The completion commit records the resulting package checksums, GitHub run, and deployed URL evidence.

## Known gap

The researched one-time monetization is intentionally absent from this release because the product-scoped checkout endpoint is not registered. No shared billing or other Sociobot resource was accessed or changed. Registering a product and restoring payment would require a separate authorized work order and a full checkout-to-native-restore verification.
