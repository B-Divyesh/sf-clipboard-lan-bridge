# Clipboard LAN Bridge — verification 2 handoff

## Result

**FAIL** for candidate `99624b4844d1e2b7a6ccb383b53d6bb46432559f` at <https://clipboard-lan-bridge.sociobot.in>, independently verified 2026-09-01 UTC.

The mandatory claim commands, clean tests, checks, build, first-read test, core transfer flow, accessibility checks, performance budget, release checksum, installer, and live static identity all pass. Release is blocked by:

1. The live **Buy route pass** URL returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
2. The desktop app's LAN companion API has no documented or enforced request allowance. Forty consecutive requests from one client all returned 200 with no `Retry-After`; the repository contains no 429 path. The external license endpoint did pass at 30 requests, with request 31 returning 429 and `Retry-After: 3`.
3. Current downloads were built from `v0.1.3` commit `550b4a5976bb939d453717fd782c498c390b2004`, not candidate `99624b4844d1e2b7a6ccb383b53d6bb46432559f`; native source and build files changed after that tag.

Additional defects: **Start for real** retains demo session data; copying a checkout-return license raises `Cannot set properties of null (setting 'textContent')` and gives no visual confirmation; several links are below the required 44 px target height; the main heading leaves a one-letter final line.

Full commands, measurements, claim-by-claim results, and live evidence are in `.factory/verification-2.md`.

## Prior repair record

The following sections are the builder's repair-2 record for context.

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
- Separated the GUI shell from the LAN protocol test target. `tauri` and `tauri-build` are now the default `desktop` feature, while `npm run check` and `npm test` exercise the same protocol library with `--no-default-features`. The desktop package still builds with that feature enabled by default.
- Added a focused release-workflow regression test and made the release workflow run `npm run check && npm test` after installing the Linux WebKit/GTK bundle dependencies.
- Updated every native claim command to use the clean core-test feature set and documented the Linux desktop build prerequisites in the README.

## Local verification evidence

Run from a clean checkout:

```sh
npm ci
npm run check
npm test
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm
CI=1 npm run tauri build -- --bundles deb
```

Observed on 2026-08-30 for repair 2:

- `npm ci`: pass; 67 packages audited; 0 vulnerabilities.
- Reproduced the candidate failure before the repair: `CI=1 npm run tauri build -- --bundles deb` and `npm run check` stopped at `glib-sys v0.18.1` because `pkg-config` could not find `glib-2.0`; the clean image did not have the Tauri Linux build prerequisites.
- `npm run check`: pass; TypeScript and the GUI-independent Cargo core check.
- `npm test`: pass; 3 Vitest tests, 2 release-policy tests, 32 Playwright desktop/mobile executions, and 6 Rust protocol tests.
- Browser coverage: desktop and 390 px, keyboard focus, 200% text, serious/critical Axe findings, privacy request log, offline reload, 404/CSP policy, demo isolation, license handoff, and clipboard actions.
- Native lifecycle: real loopback sockets cover pair → approve → send → receive → replay rejection → expiry rejection.
- Native phone smoke: local companion returned HTTP 200, displayed one `h1`, produced a six-character code, logged no console errors, and had zero serious/critical Axe findings at 390×844.
- `npm run build`: pass; `dist/app/` and `dist/site/` produced. Initial app JS is 14.80 KB raw; site JS is 3.64 KB raw; CSS is below 11 KB per entry; social image is 44.81 KB.
- Clippy with warnings denied: pass.
- Exact clean bundle command `CI=1 npm run tauri build -- --bundles deb`: pass after the documented Linux prerequisites; produced `src-tauri/target/release/bundle/deb/Clipboard LAN Bridge_0.1.3_amd64.deb` (5,184,540 bytes).
- Worker `verify-url.sh`: pass; title, `lang`, one `h1`, main landmark, alt text, and zero console errors at desktop/390 px.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, TBT 0 ms, CLS 0.

## Release and deployment

### Repair 2 deployment

- Repair commit `7318823c3c843f6c47e7b9d34701eb25d71d7de3` was pushed to `origin/main`.
- Built `dist/site/` was deployed to the scoped `sf-clipboard-lan-bridge` Static Web App production environment. The deployment returned `https://lemon-water-0a2acb910.7.azurestaticapps.net`; the production custom domain serves the deployed `main-C5qXxzqc.js` asset.
- Live identity checks: `/`, `/demo/`, `/privacy/`, `/terms/`, `/robots.txt`, and `/sitemap.xml` return 200; an unknown route returns 404. The response includes CSP, HSTS, nosniff, referrer, and permissions headers.
- Live Playwright + Axe checks at desktop (1440×900) and mobile (390×844) passed on `/`, `/demo/`, `/privacy/`, and `/terms/`: one `h1`, one `main`, no horizontal overflow, no console errors, and no serious/critical violations.

- Tag `v0.1.3` points to desktop release commit `550b4a5976bb939d453717fd782c498c390b2004`.
- GitHub Actions run `33298966333` completed successfully. The release contains arm64/x86_64 macOS DMGs, Windows MSI/EXE, and Linux AppImage/DEB/RPM packages plus `SHA256SUMS` and valid `latest.json` metadata.
- Downloaded DEB SHA-256 `665dc8d6173a596fc2111860634ae32c9c067173111f117989a4a5ad6a112aa5` matches `SHA256SUMS`.
- The live installer downloaded and verified AppImage SHA-256 `020ad191346daa36fd5715ce97edbf0c932fd9124c88c8ed456d3f72658bc7ee`, installed it in an isolated directory, and the released app launched under Xvfb. Its phone companion answered HTTP 200 on port 38743.
- `dist/site` was deployed to the existing `sf-clipboard-lan-bridge` Static Web App. No DNS, billing, database, vault, or unrelated service was read or modified.
- Live routes `/`, `/demo/`, `/privacy/`, `/terms/`, `/robots.txt`, and `/sitemap.xml` return 200; an unknown route returns the designed page with 404 status.
- Live HTML SHA-256 `8910a104d9faa413138c55cdf048317c882e3e9881206e20b0f593c2c95b13b1` and service-worker SHA-256 `644db754dff5b74de03668a13b30a1eb5eada5595c1453d7b748d5640dec124d` match the deployment build. CSP, HSTS, `nosniff`, referrer, and permissions headers are present.
- Live desktop and 390 px checks across all public routes found one `h1`, no overflow, no serious/critical Axe finding, and no console error on successful pages.
- Live offline reload of `/demo/` retains the demo banner with an active service worker and no console errors.
- The live Linux action resolves to the v0.1.3 AppImage and reports its published checksum without console errors.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 30 ms, CLS 0.

## Needs operator action

Release packages remain unsigned. Signing requires owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`; users currently receive the documented operating-system warning.

## Known gaps

Verification 2 found the release blockers and additional defects listed in the Result section. The phone companion also requires the phone and desktop to remain on the same LAN, as designed.
