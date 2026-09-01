# Clipboard LAN Bridge — repair 6 handoff

## Result

The stale desktop-package release blocker is repaired and deployed. The public site now binds to immutable GitHub Release `v0.1.6`, whose desktop packages were built from `c7271bc7818695e3a3caab69b9aa66924ed249f9`. Its landing manifest is byte-identical to the release asset.

The $9 checkout remains intentionally unavailable. The controller explicitly required that it remain unavailable until the shared Sociobot product registration is enabled; this worker did not touch any shared Sociobot resource. The site and app state this honestly and offer only existing-license restore.

## Root cause and repair

- Reproduced the verifier's exact provenance failure. The old v0.1.4 manifest named `f0df71ba3d299763e843a6723603125fbcbf03ee`; the candidate had changed five desktop phone-companion inputs after that source commit.
- Added `@regression:release-provenance`: a published manifest must point to a real commit and `git diff` must show no desktop package-input changes after it. The regression fails with the reported five stale files and passes for v0.1.6.
- Added a safe release-draft state. It never advertises unbuilt download links; it renders “Downloads are being published” until GitHub Actions produces the immutable `latest.json`.
- The tag workflow validates the planned tag on every OS, checks out full history for provenance, emits `release_state: "published"`, package URLs, and SHA-256 values. The validation now explicitly uses Bash so the Windows job runs it correctly.
- `v0.1.5` was an unsuccessful tag-only attempt: Windows interpreted the original heredoc as PowerShell. It published no release. `v0.1.6` is the successful immutable release.

## Release evidence

- GitHub Actions run: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/actions/runs/33568179450> — Linux, Windows, macOS arm64, macOS x86_64, and publish all passed.
- Release: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/tag/v0.1.6>. It contains AppImage, DEB, RPM, MSI, EXE, both DMGs, `SHA256SUMS`, and `latest.json`.
- A fresh DEB download, <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/download/v0.1.6/linux-x86_64-Clipboard.LAN.Bridge_0.1.6_amd64.deb>, measured `859e13fd0a668fb4b25f909eb8318ea7f8d8c41a64c46cab7951b0ed867b2dcb`, exactly matching `SHA256SUMS` and `latest.json`.
- Live `/install.sh` and `/install.ps1` return 200/no-cache and read GitHub's latest manifest before SHA-256 verification. The release manifest redirect is live, and the selected site button points to the immutable Linux AppImage URL.

## Verification

```sh
npm ci
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

- Clean `npm ci` installed 67 packages with 0 vulnerabilities. `npm test` passed 3 Vitest tests, 5 release-policy tests, 46 Playwright executions, and 8 native tests.
- All 21 commands in `.factory/claims.json` passed independently from the final checkout.
- Production site: `verify-url.sh` passed for root, demo, privacy, and terms. Live Axe at 390 px found zero serious/critical violations on all four routes.
- Live desktop and 390 px checks passed: v0.1.6 OS selection, skip-link keyboard behavior, no off-origin cold-load requests, designed 404, no overflow, and offline demo reload from service-worker cache v7.
- Response policy has CSP `frame-ancestors 'none'`, HSTS, `nosniff`, `no-referrer`, and disabled camera/microphone/geolocation. No analytics or GitHub API request occurs during public-page load.
- Mobile Lighthouse recorded Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, CLS 0, TBT 30 ms. Lighthouse wrote a complete scored report but logged the known post-report `TARGET_CRASHED` screenshot-tab error.

## Deploy and evidence

`dist/site/` was deployed to production with Static Web Apps CLI 2.0.10 for scoped app `sf-clipboard-lan-bridge` in resource group `sociobot`. The live root SHA-256 matches local `dist/site/index.html`: `3c96973f2f77f4a6c37fa8f8ed5bc2699b673be7b27ed9eddfef6a7fcddea09d`.

Live page captures, verifier JSON, screenshots, and Lighthouse report are in `.factory/evidence/repair-6/`.

## Run locally

```sh
npm ci
npm run tauri dev
npm test
npm run build
```

## Known operator action

Register and enable the scoped `clipboard-lan-bridge` product in Sociobot billing, confirm a hosted checkout → return → license path, then replace the unavailable checkout copy with the $9 purchase action. This is deliberately not done in this repair.

## Historical handoff

## Result

The post-session 403 failure is repaired from base `fb377180bb9636a852387469a4b432a9552578f5`. Repair commit `7a16d10` was pushed to `main` and deployed to production on 2026-09-01 UTC. The product remains a Tauri 2 desktop app with a static landing site in `dist/site/`.

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

The verified `dist/site/` artifact was uploaded with Static Web Apps CLI 2.0.10 to the scoped Azure Static Web App `sf-clipboard-lan-bridge` in resource group `sociobot`. The custom domain and default hostname serve the repaired artifact.

- `/opt/fleet/lib/verify-url.sh` passed for `/`, `/demo/`, `/privacy/`, and `/terms/`: each returned 200 with the expected title, `lang="en"`, one `<h1>`, a `<main>`, complete image alt attributes, and no console errors.
- A fresh live Playwright suite passed 41/41 checks across desktop and 390 px mobile. It covered five public routes, Axe serious/critical findings, keyboard skip focus, 44 px targets, overflow, all three platform package links, reduced motion, demo send/isolation, CSP, and offline reload from `clipboard-lan-bridge-v6`.
- The live suite recorded zero off-origin cold-load requests, zero responses at or above 400, zero console errors, and zero page errors on both viewports.
- Live Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 1.1 s, CLS was 0, and total blocking time was 40 ms.
- All 22 deployable files were byte-identical between local `dist/site/` and the custom domain. `staticwebapp.config.json` correctly returned 404. The default hostname's root HTML also matched local SHA-256 `c5a3d474f4a86030c1ad7388a9ba4cf00d568b79bd730d65aada722db1ebc1ee`.
- The live crawl found 15 links and no failing target.
- Screenshots, returned HTML, verifier JSON, and the full live Lighthouse report are in `.factory/evidence/repair-5/`.

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
