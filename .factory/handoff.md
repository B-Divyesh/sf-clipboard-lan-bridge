# Clipboard LAN Bridge — verification 8 handoff

## Independent verification 8 — PASS

Candidate `a6dc612383ffa21954d22cb98e7f6450e3abc1e3` is **PASS** for <https://clipboard-lan-bridge.sociobot.in> as verified on 2026-09-02 UTC. The verifier changed no product code.

- Fresh `npm ci`, all 21 declared claim commands, `npm test`, `npm run check`, Rust format/clippy gates, and `npm run build` passed.
- The candidate production site was byte-matched for root HTML and its hashed landing CSS/JS. Live desktop and 390 px checks passed accessibility, keyboard, reduced-motion, privacy-request, headers/cache, demo, PWA offline reload, and normal/invalid sample-flow checks.
- The native companion allowance is 30 requests per client per 10 seconds; request 31 returns HTTP 429 with `Retry-After`.
- No defects were found. Details and exact evidence are in `.factory/verification-8.md`.

The product still deliberately has no enabled checkout and no code-signed desktop packages. Its page gives the truthful unavailable-purchase and unsigned-package guidance; this is not a verification failure.

## Result

All release-blocking findings from independent verification commit `b458f2a` are repaired. The repaired static site is live at <https://clipboard-lan-bridge.sociobot.in>, and desktop release `v0.1.9` is published for Linux, macOS, and Windows.

## Repairs

- Ran `cargo fmt` and committed every reported formatting hunk in `src-tauri/src/lib.rs`.
- Moved `@claim:paid-unlock` into its own Playwright project. It now receives a separate worker, Chromium process, and fresh browser context instead of depending on the aggregate suite's long-lived browser.
- Added a regression that checks the landing site and desktop app expose no dead checkout action, make no checkout request, and still pass an existing return token to desktop restore.
- Made checkout default-off. The exact scoped URL is rendered only when an operator explicitly builds with `VITE_CHECKOUT_URL=https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout`.
- Replaced purchase-success copy across the site, desktop app, README, privacy page, terms, claims, and copy audit with the truthful current state: purchases are unavailable; existing license tokens can still be restored.
- Added service-worker update coverage that seeds an obsolete cache, confirms `clipboard-lan-bridge-v8` replaces it, and then reloads the demo offline.
- Bumped the app and site to `0.1.9`.

No shared Sociobot resource, billing registration, database, secret, staging slot, or other product resource was read or changed. A read-only policy check still returns HTTP 404 for the scoped checkout. The site therefore does not show a purchase action or claim that checkout succeeds.

## Verification

Run locally:

```sh
npm ci
npm test
npm run check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm run build
```

Observed on 2026-09-02 UTC:

- Baseline reproduction: `cargo fmt --check` failed with the verifier's five hunks. The unchanged aggregate browser command passed once, confirming the reported Chromium crash was intermittent; the verifier's captured `SIGSEGV_MAPERR` remains the failing evidence that motivated process isolation.
- Clean `npm ci`: 67 packages audited, 0 vulnerabilities.
- Four consecutive corrected `npm test` runs passed. Each completed 3 Vitest tests, 3 release tests, 47 Playwright tests, and 8 Rust tests.
- Every one of the 21 commands in `.factory/claims.json` passed exactly as recorded.
- `npm run check`, Clippy with `-D warnings`, and `cargo fmt --check` passed.
- `npm run build` produced `dist/app/` and `dist/site/`. Landing JS is 4.96 KB raw / 1.93 KB gzip; CSS is 9.82 KB raw / 2.81 KB gzip; the mobile hero is 32,472 bytes.
- Local Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.4 s, CLS 0, TBT 60 ms. See `evidence/repair-8/lighthouse-local.json`.
- Live Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.1 s, CLS 0, TBT 0 ms. See `evidence/repair-8/lighthouse-live.json`.
- `verify-url.sh` passed root, demo, privacy, and terms locally and live at desktop and 390 px, with correct title/lang/h1/main/alt checks and no console errors. Screenshots and reports are under `evidence/repair-8/`.
- The live QA script passed 71 checks across desktop and 390 px, including Axe serious/critical = 0, 44 px targets, keyboard focus, 200% text reflow, reduced motion, no horizontal overflow, same-origin requests, demo isolation, gated checkout, Linux/Windows/macOS v0.1.9 selection, existing-token return, cache replacement, and offline demo reload. See `evidence/repair-8/live-qa.json`.
- The live link crawl checked 16 unique destinations with no HTTP failures and no checkout URL exposed. See `evidence/repair-8/link-qa.json`.
- All 22 public files in `dist/site/` byte-match production. `staticwebapp.config.json` correctly returns 404.
- Production headers include HSTS, `nosniff`, `Referrer-Policy: no-referrer`, restrictive Permissions-Policy, and CSP with `frame-ancestors 'none'`. Hashed assets are one-year immutable; `sw.js` is no-cache; HTML revalidates after 30 seconds.
- Billing response policy: checkout returned 404 `{"error":"enabled factory product","status":404}`; an invalid verification token returned HTTP 200 with `valid:false`, `reason:"invalid"`, and the expected production-origin CORS header.

## Release and deployment

- Release: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/tag/v0.1.9>
- Release workflow: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/actions/runs/33584936018> — success.
- Tagged source: `e15a40fe746244e962c4a0df9c713d1b915b4a5a`.
- Published assets: AppImage, DEB, RPM, MSI, EXE, macOS arm64 DMG, and macOS x86_64 DMG, plus `SHA256SUMS` and `latest.json`.
- The release verification downloaded one package from each desktop platform and matched its SHA-256. The one-line Linux installer also downloaded and verified the v0.1.9 AppImage, whose runtime metadata loaded successfully.
- Static deployment: `981ca77c-3000-4766-a4a3-6db61edd859f` to the existing `sf-clipboard-lan-bridge` resource.
- Live identity: 22/22 served static artifacts match the final local production build byte for byte.

## Needs operator action

- Checkout remains intentionally unavailable. After product-scoped billing enrollment is complete and the exact checkout URL returns a working hosted checkout, rebuild with the documented `VITE_CHECKOUT_URL` value and independently verify checkout, return, restore, and revocation before advertising sales.
- Desktop packages are unsigned. macOS notarization and Windows Authenticode require the owner's signing credentials (`APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`, plus their associated passwords) in the release workflow.
