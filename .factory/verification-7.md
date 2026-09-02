# Independent product verification 7

## Verdict: FAIL

- Candidate commit: `774f0fd13e0e31a8b354aa6b4056bdbfa5b38233`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-verify-7`

The free local-transfer product and its public site are largely working, but this candidate is not releasable. It has a dead paid-purchase action, a non-green aggregate test command, and a committed Rust formatting failure.

## First-read and demo gate

PASS. A fresh cold load plainly says **“Send text to nearby devices”**, says it moves a link, address, or note between a phone and computers on the same local network, and presents **Try it with sample data** above the fold. One click reached `/demo/` and showed the persistent **Demo — sample data, nothing is saved** banner, realistic Kitchen phone / Studio laptop sample data, Reset demo, and Start for real. Demo storage was only `sessionStorage["demo:clipboard-lan-bridge:tickets"]`; the real local-storage ticket key remained absent.

## Mandatory claims gate

PASS when run individually from this clean checkout after `npm ci`. `.factory/claims.json` is present and contains 21 unique claims. Every command in its `test` field was executed exactly and passed.

This includes published v0.1.8 packages and checksums; direct paired send/receive; encryption and metadata-tampering rejection; receiver approval; mobile companion round trip; deliberate clipboard read/write; local persistence boundaries; the 32 KB UTF-8 limit; expiry; demo isolation; no account; no telemetry; free-peer limit; and native license-verdict handling.

The companion API claim observed the documented allowance: 30 successful requests from one loopback network client in 10 seconds, then request 31 returned HTTP `429 Too Many Requests` with a positive `Retry-After` header. There is no sign-in flow, so the Entra tenant condition is not applicable.

## Clean-checkout gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 67 packages, 0 reported vulnerabilities |
| Each of 21 `claims.json` commands | PASS individually |
| `cargo test --manifest-path src-tauri/Cargo.toml --no-default-features` | PASS — 8 tests |
| `npm run check` | PASS — TypeScript and no-default-feature Rust check |
| `npm run build` | PASS — produced `dist/app/` and `dist/site/` |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings` | PASS |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | **FAIL** — committed formatting diffs in `src-tauri/src/lib.rs` |
| `npm test` | **FAIL** — 47 Playwright tests passed and `@claim:paid-unlock` failed after Chromium SIGSEGV; the command exited 1 before its final Rust suite |

The aggregate Playwright failure was `browser.newContext: Target page, context or browser has been closed`, following a Chromium `SIGSEGV_MAPERR`. The isolated `@claim:paid-unlock` command passed, so this is a suite-stability defect, not evidence that the checked UI assertion itself is false. It nevertheless leaves the required aggregate test command non-green.

## Live deployment and product QA

- **Deployment identity: PASS.** A fresh candidate production build byte-matched every publicly served static artifact: root, demo, privacy, terms, 404, JS, CSS, images, service worker, installer scripts, robots, sitemap, and favicons. `staticwebapp.config.json` correctly is not publicly served (404); its behavior is confirmed by the live headers.
- **Desktop and 390 px mobile: PASS.** Root, demo, privacy, terms, and 404 had `lang=en`, exactly one `h1`, a `main` landmark, correct per-route titles, and no horizontal overflow. The first Tab focused the visible 44.8 px skip link with a deliberate high-contrast box-shadow focus ring.
- **Accessibility: PASS.** Playwright Axe found zero serious/critical WCAG 2 A/AA findings on the above live routes at desktop and 390 px. With reduced motion requested, computed animation duration was `0s`.
- **Privacy/network: PASS.** Fresh desktop and mobile public-route plus demo flows requested only `https://clipboard-lan-bridge.sociobot.in`, with no analytics, CDN, GitHub API, or other external request. Normal root/demo loads had no console or page errors. The deliberate 404 navigation naturally logs its own failed-resource response and is not a normal-load error.
- **PWA: PASS.** On a fresh live mobile context, the demo became service-worker-controlled and reloaded offline while retaining the demo banner without console/page errors.
- **Headers/cache/budget: PASS.** Live root sends HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive Permissions-Policy, and CSP with `default-src 'self'`, `connect-src 'self'`, and `frame-ancestors 'none'`. HTML uses 30-second revalidation; hashed assets are one-year immutable; `sw.js` is no-cache. Candidate site output is 4.63 KB JavaScript (1.78 KB gzip) and 9.82 KB CSS (2.81 KB gzip); the 768 px WebP is 32,472 bytes.
- **Release artifacts: PASS.** The exact release checks verified v0.1.8 macOS, Windows, and Linux packages against SHA-256 checksums. The manifest source commit `6f4128643a227c5da837dde8e2a97d92f78fe864` is an ancestor of the candidate.

## Release-blocking defects

### P1 — The visible $9 purchase action is a dead link

The landing page and README promise a **$9 one-time license**. On 2026-09-02 UTC, a fresh request to `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` returned HTTP `404`, not checkout or a usable recovery state. This prevents purchase and makes the paid-unlock promise untrue in production. Enroll/enable the scoped billing product, verify the real checkout/return/restore flow, then rerun the claim and live link checks.

### P1 — `npm test` is flaky and currently fails

`npm test` exited 1: 47 of 48 Playwright tests passed, then the declared `@claim:paid-unlock` test could not create its browser context because Chromium crashed with `SIGSEGV_MAPERR`. Isolated claim commands pass, but the aggregate required command is not reliable. Stabilize the browser suite and demonstrate repeated clean `npm test` passes.

### P1 — Rust formatting gate fails

`cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` reports five formatting hunks in `src-tauri/src/lib.rs` (around the mobile-companion round-trip test). Apply the formatter and commit the generated formatting; no behavioral change is required.

## Required next steps

1. Enable the product in the Sociobot billing system and verify the real `$9` checkout, return-token, and native restore path.
2. Fix the aggregate Playwright stability problem and rerun `npm test` repeatedly in a clean checkout.
3. Format the Rust source, then rerun `cargo fmt --check`, all claims, `npm test`, `npm run check`, and `npm run build`.
