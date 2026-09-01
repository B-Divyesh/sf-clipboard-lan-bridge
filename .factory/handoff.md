# Clipboard LAN Bridge — repair 5 handoff

## Result

The post-session 403 failure is repaired locally from base `fb377180bb9636a852387469a4b432a9552578f5`. The product remains a Tauri 2 desktop app with a static landing site in `dist/site/`.

## Root cause and repair

- Reproduced the failure at both 1440 × 900 and 390 × 844. A cold landing load requested `GET https://api.github.com/repos/B-Divyesh/sf-clipboard-lan-bridge/releases?per_page=1`.
- A recorded HTTP 403 response produced Chromium's uncaught console entry `Failed to load resource: the server responded with a status of 403 (Forbidden)`. The visible `try/catch` fallback did not suppress that browser-level error.
- Removed the GitHub API request from cold load. The site now bundles the exact published v0.1.4 `latest.json` as `site/release-manifest.json` and selects a real platform package without runtime metadata fetches.
- Removed `api.github.com` from `connect-src`, updated the privacy explanation, and bumped the service-worker cache to `clipboard-lan-bridge-v6`.
- Added a release-manifest structure/link/checksum test and a Playwright regression that makes the GitHub API return 403 if called. The test opens landing, demo, privacy, terms, and 404 routes and requires zero GitHub requests, HTTP failures, console errors, and page errors on desktop and mobile.
- Registered the stricter public-page network boundary in `.factory/claims.json`.

## Local verification

Commands completed in this repair worker:

```sh
npm ci
npm test
npm run check
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

- Exact clean install/build sequence: `npm ci && npm run build` passed; 67 packages audited with 0 vulnerabilities. It generated `dist/app/` and `dist/site/`.
- `npm test` passed 3 Vitest tests, 4 release-policy tests, 46 Playwright executions, and 8 Rust tests.
- All 21 commands declared in `.factory/claims.json` passed independently.
- Focused 403 coverage passed in desktop and mobile projects. It found no GitHub request, response at or above 400, console error, or page error across every public route.
- The Playwright suite covers desktop and 390 px mobile layouts, keyboard focus, 44 px targets, reduced motion, Axe serious/critical findings, offline/update behavior, demo storage isolation, clipboard boundaries, native license handling, and encrypted LAN lifecycle tests.
- `npm run check`, all-features Clippy with warnings denied, Rust format verification, and `git diff --check` passed.
- The published v0.1.4 `latest.json` is byte-identical to `site/release-manifest.json`. The 76.3 MB Linux AppImage downloaded successfully and matched SHA-256 `5c57c30ce8cf99dceac33957c172d5f8606407df9734a1a8ee0c77ab31a6742c`.
- Mobile Lighthouse against the production build scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 1.4 s, CLS was 0, and total blocking time was 0 ms.
- Production budgets: landing JS 5.07 KB (1.88 KB gzip), shared JS 0.87 KB (0.47 KB gzip), landing CSS 10.10 KB (2.90 KB gzip), and largest hero WebP 65.81 KB.
- The existing `.factory/copy-audit.md` still matches unchanged landing copy. A fresh rendered-text scan found no sentence over 22 words and no banned marketing term.

## Deploy and verify

The scoped production target is Azure Static Web App `sf-clipboard-lan-bridge` in resource group `sociobot`, default hostname `lemon-water-0a2acb910.7.azurestaticapps.net`. Deploy only `dist/site/` with that resource's token. Record the deployed commit, worker verifier result, live browser checks, Lighthouse result, file identity, and link/package verification here after deployment.

## Run locally

```sh
npm ci
npm run tauri dev
npm test
npm run build
```

The static artifact is `dist/site/`. Desktop packages remain built by the tag-triggered GitHub Actions workflow.

## Known operator action

Enable the registered `clipboard-lan-bridge` product in the Sociobot billing service, verify its hosted checkout and return URL, then restore the `$9 once` purchase action. The current site honestly marks checkout unavailable because that shared product registration is operator-gated.
