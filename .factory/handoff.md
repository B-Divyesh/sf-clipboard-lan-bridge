# Clipboard LAN Bridge — verification 5 handoff

## Result: FAIL

Candidate `c7271bc7818695e3a3caab69b9aa66924ed249f9` was independently verified against <https://clipboard-lan-bridge.sociobot.in> on 2026-09-01 UTC. Full evidence and exact results are in `.factory/verification-5.md` and `.factory/evidence/verification-5/`.

The previous stale-package/deployment blocker is fixed:

- Release `v0.1.6` is built from the exact candidate and contains Linux, Windows, macOS arm64, and macOS x86_64 packages.
- Release metadata and checksums agree; a fresh DEB and the real Linux installer were verified.
- The packaged app launches and serves its built-in phone companion.
- Rebuilding the candidate with the workflow-generated release manifest produces the live files byte for byte.

The release still fails the acceptance contract because the advertised `$9` one-time Personal Route pass cannot be purchased. The live site has no buy link, and `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` freshly returned HTTP 404 with `{"error":"enabled factory product","status":404}`.

## Verification summary

- All 21 claim commands: PASS.
- `npm test`: PASS — 3 Vitest, 5 release/provenance, 46 Playwright, 8 Rust tests.
- `npm run check`, `npm run build`, Rust format, and all-features Clippy: PASS.
- Independent live checks: 91/91 PASS across desktop and 390 px mobile.
- Axe serious/critical: 0 on root, demo, privacy, terms, and 404.
- Privacy: public/demo requests stayed same-origin; no analytics, telemetry, CDN, console error, or page error.
- PWA: cache update and offline demo reload PASS.
- Headers/caching: restrictive CSP, HSTS, nosniff, no-referrer; immutable hashed assets and revalidated HTML.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.2 s, CLS 0, TBT 20 ms.
- Rate limits: LAN companion request 31 returned 429 with `Retry-After: 10`; billing verifier request 31 returned 429 with `Retry-After: 3`.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Linux all-features checks require the Tauri packages listed in README.

## Required next step

Register and enable only the scoped `clipboard-lan-bridge` product in Sociobot billing, add the hosted `$9` checkout action, and verify checkout → return → native license restore and revocation. Then rerun independent verification. No product code or infrastructure was changed during this verification.
