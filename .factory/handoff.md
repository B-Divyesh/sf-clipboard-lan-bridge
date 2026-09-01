# Clipboard LAN Bridge — repair 3 handoff

## Result

The verifier's release-blocking findings for candidate `99624b4844d1e2b7a6ccb383b53d6bb46432559f` are repaired in release `v0.1.4`.

- The LAN companion now applies one shared allowance to every companion route: **30 requests per client IP in 10 seconds**. The next request returns **HTTP 429** with a positive `Retry-After` header. The phone client presents that response instead of attempting to parse it as JSON.
- The release workflow records `source_commit` in `latest.json`; the v0.1.4 tag is the exact source used for installer publication.
- The known shared checkout 404 is operator-gated. The site and desktop app no longer advertise a purchase action that leads to it. Existing Route pass licenses can still be pasted and verified, and checkout-return tokens still copy into the app.
- **Start for real** deletes `demo:clipboard-lan-bridge:tickets` before navigating home.
- Checkout-return copying retains a stable button reference across the clipboard await, gives an announced success or recovery message, and raises no page error.
- Public links and checked controls are at least 44 CSS px high at desktop and 390 px. The hero keeps **devices** as one word instead of leaving a one-letter final line.

## Reproduction before repair

After the exact clean install, the strengthened existing checkout-return regression failed as required:

```sh
npx playwright test --grep '@claim:license-handoff' --project=desktop-chromium
```

It reproduced the verifier's page error exactly:

```text
Cannot set properties of null (setting 'textContent')
```

The same test now mocks the explicit user clipboard action, checks the copied token and visible feedback, and asserts no `pageerror`.

## Regression coverage

- `phone_companion_enforces_a_documented_per_client_allowance` starts an isolated companion server, makes 30 status requests, then asserts 429 and a positive `Retry-After` on request 31. It is registered as `@claim:companion-api-allowance`.
- `@claim:sample-demo` sends a uniquely named sample, selects **Start for real**, asserts the demo key is absent, then reopens `/demo/` and confirms the sent sample is gone.
- `@claim:license-handoff` asserts URL cleanup, storage, successful clipboard copy, feedback, and no page error.
- `@claim:checkout-status` asserts the honest unavailable state and no checkout link while the shared checkout is gated.
- The browser target regression checks every visible public link/button/summary on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` at desktop and 390 px, and checks that the final hero line is not `S`.
- The release policy regression asserts that `latest.json` receives GitHub's exact `SOURCE_COMMIT`.

## Verification

Run from this repair checkout:

```sh
npm ci
npm run check
npm test
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Observed on 2026-09-01 UTC:

- `npm ci`: pass; 67 packages audited, 0 vulnerabilities.
- `npm run check`: pass; TypeScript plus GUI-independent native core check.
- `npm test`: pass; 3 Vitest tests, 3 Node release-policy tests, 36 Playwright desktop/mobile tests, and 7 Rust tests.
- `npm run build`: pass; produced `dist/app/` and `dist/site/`. App JS is 14.75 KB raw / 5.35 KB gzip. Initial site JS is 4.48 KB raw / 2.01 KB gzip including the preload helper. Main site CSS is 10.09 KB raw / 2.89 KB gzip.
- Clippy: pass with `-D warnings` after installing the documented Linux WebKit/GTK prerequisites.
- Browser coverage includes desktop and Pixel 5 (390 px), keyboard navigation, 200% text reflow, reduced motion, privacy request logging, offline demo reload/update cache, console/page errors, and serious/critical Axe findings. All pass.
- The repository has no `verify-url.sh`; equivalent title/lang/h1/main/alt/console checks are in the Playwright suite. The attached standalone Axe CLI was attempted against the local production build but could not launch because its ChromeDriver only supports Chrome 152 while the supplied Playwright Chromium is 145. The Playwright Axe integration uses the supplied browser and passed with zero serious/critical findings on every tested public route.
- This is a desktop app; package builds happen only in GitHub Actions. The release workflow builds unsigned macOS arm64/x86_64 DMGs, Windows MSI/EXE, and Linux AppImage/DEB/RPM, attaches `SHA256SUMS` and `latest.json`, and now writes its exact source commit to that manifest.

## Deployment and release

- Static deployment artifact: `dist/site/`.
- Desktop release tag: `v0.1.4`, pushed with this repair candidate. The GitHub Actions release workflow is the authorized installer builder; its `latest.json.source_commit` is the tag commit for provenance verification.
- The static deployment is triggered from the scoped product repository's `main` branch. No DNS, billing, database, vault, or unrelated service was read or modified.

## Needs operator action

- The shared Sociobot checkout must be enabled by its operator before a **Buy Route pass** link can be restored. The product deliberately shows the unavailable state until then.
- Packages remain unsigned. Publishing signed macOS and Windows installers requires owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`.

## Known gaps

No code-level release blockers remain. The phone companion still requires the phone and desktop app to stay on the same LAN by design.
