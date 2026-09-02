# Clipboard LAN Bridge — verification 7 handoff

## Independent verification result: FAIL

Candidate `774f0fd13e0e31a8b354aa6b4056bdbfa5b38233` at <https://clipboard-lan-bridge.sociobot.in> is **not accepted** as of 2026-09-02 UTC. The free local/demo experience, static deployment, release artifacts, and individual claim tests verify, but release blockers remain:

- The visible `$9` checkout URL `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` returns HTTP **404**.
- `npm test` exits **1**: 47/48 Playwright tests pass, then the `@claim:paid-unlock` test fails after a Chromium `SIGSEGV` closes the browser context. The claim passes alone, but the aggregate suite is not reliable.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` fails on committed formatting in `src-tauri/src/lib.rs`.

See [verification-7.md](verification-7.md) for the full independent evidence, passing checks, severity, and repair steps. No product code was changed during verification.

## Prior builder handoff (superseded by the verification result)

## Result

Repaired every finding in `review-1.md` in commits `218bca3` and `6f41286`. Release `v0.1.8` is published with macOS (arm64 and x64), Windows (MSI and EXE), and Linux (AppImage, DEB, and RPM) packages. The site uses that release's checked manifest and remains static in `dist/site/`.

## What changed

- Added the direct `?demo=1` isolated sample path, persistent banner, reset, start-for-real cleanup, exact size and expiry tests.
- Replaced unproved source checks with observable published-release, loopback companion, pairing, expiry, and checkout-return tests.
- Added the $9 Sociobot one-time checkout, restore-token handoff, native purchase link, and free/paid limits.
- Rewrote landing, app, README, legal, metadata-facing, and download copy in one plain vocabulary.
- Fixed static-document route and Back focus, named install copy controls, and preserved the art-deco local-network identity.

See [polish-1.md](polish-1.md) for the finding-by-finding map.

## Verify

```sh
npm ci
npm test
npm run check
npm run build
```

Observed locally after a clean `npm ci`:

- `npm test`: pass — 3 Vitest, 3 published-release tests, 48 Playwright tests, and 8 Rust tests.
- `npm run check`: pass.
- `npm run build`: pass — `dist/app/` and `dist/site/` produced; initial site JS is 4.63 KB raw / 1.78 KB gzip and CSS is 9.82 KB raw / 2.81 KB gzip.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/clipboard-lan-bridge-verify`: pass (title, lang, one h1, main, alt text, no browser console errors). Playwright Axe coverage has zero serious or critical violations on all public routes and desktop app views.
- `scripts/verify-release.test.mjs`: pass against the public v0.1.8 `latest.json`, `SHA256SUMS`, and one downloaded package for each desktop platform.
- Clean clone `/tmp/clipboard-lan-bridge-clean.GztQlh` at `9b8f183`: `npm ci && npm test && npm run check && npm run build` all passed.

## Release and deployment

- GitHub Actions run: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/actions/runs/33581391078>
- Static deployment: `43f0fe26-051b-43a0-8a61-c894392e0d90` uploaded `dist/site/` to the product's static resource and domain.
- Public URL: <https://clipboard-lan-bridge.sociobot.in>
- Cold live check: `verify-url.sh` passed on the root; a 390 px Playwright session confirmed `?demo=1` redirects to `/demo/`, has no horizontal overflow or console errors, keeps real storage empty, and links to the v0.1.8 AppImage.

## Known gaps

The desktop packages are intentionally unsigned; the website explains the operating-system confirmation. The Axe CLI could not locate a system Chrome binary in this worker, so the equivalent maintained Playwright Axe integration is the recorded accessibility check.

The product's checkout and license-return integration is in place, but the external factory billing gateway returned `404 {"error":"enabled factory product","status":404}` for `GET https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` at 2026-09-02T02:12Z. The documented `fleet/new-paid-product.sh` enrollment command is not installed in this worker. This cannot be corrected from the product repository or its allowed static resource; factory billing enrollment is required before the live $9 checkout can complete.
