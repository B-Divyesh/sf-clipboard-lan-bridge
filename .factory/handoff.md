# Clipboard LAN Bridge — repair handoff

## Result

Repair of independent verification 3 (`ae930caa3d8b34a9ab1d2705cd8b25e16fdd49a3`) is ready for static deployment.

The shared Sociobot checkout remains deliberately shown as unavailable. Its product-scoped checkout response is operator-gated (`404 {"error":"enabled factory product"}`), so no product code change can honestly restore the purchase link. The site does not advertise a dead checkout action.

## Fixed findings

- Added claim entries and tagged regression coverage for deliberate clipboard writes and the local persistence boundary. Identity, paired keys, and license data are written to app configuration; active inbox and sent tickets are not.
- Reproduced the phone companion failure before changing it: a one-character name displayed `Use a valid phone name and identity.` and Chromium logged `Failed to load resource: the server responded with a status of 400 (Bad Request)`. The client now validates the UTF-8 byte length before posting. Server validation remains in place. The regression uses the real bundled companion script and a 400 pairing fixture, verifies the recovery message, zero pairing requests, and zero console errors.
- Made every public `<main>` programmatically focusable and added a shared skip-link focus handler. Regression covers `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`.
- Enforced 44 × 44 px link targets, including legal-footer links, and strengthened the browser regression to inspect both width and height at desktop and 390 px.
- Explained phone browser background-polling limits in the landing page, phone companion, README, and Terms. The companion tells people to keep the page open and that arrivals may wait until they return.
- Brought demo, Privacy, Terms, and 404 into the shared wordmark/header/footer frame. Each has route-specific title, description, canonical URL, Open Graph, Twitter card, favicon, and apple-touch metadata.
- Ran `cargo fmt`; the native core now satisfies the format check.
- Repaired the incomplete README local-package instruction and refreshed the landing copy audit.
- Bumped the service-worker cache name to `clipboard-lan-bridge-v5` so updated public route shells are fetched after deployment.

## Verification

Clean install and quality gates completed in this worker:

```sh
npm ci
npm test
npm run check
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

- `npm ci`: 67 packages, 0 vulnerabilities.
- `npm test`: passed 3 Vitest tests, 3 release-policy tests, 44 Playwright executions, and 8 Rust tests.
- All 20 commands in `.factory/claims.json` passed exactly as declared.
- `npm run check`: TypeScript and native core check passed.
- `npm run build`: generated `dist/app/` and `dist/site/`.
- All-features clippy with warnings denied passed after installing the documented Linux GUI prerequisites; Rust format check passed.
- Focused browser verification: 30 site tests and 14 desktop-webview tests passed across desktop and mobile Chromium. Axe found no serious or critical issues on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`.
- The production build reports 3.76 KB landing JS (1.60 KB gzip), 0.87 KB shared accessibility module (0.47 KB gzip), 10.10 KB landing CSS (2.90 KB gzip), and 14.75 KB desktop webview JS (5.35 KB gzip).

## Run and deploy

```sh
npm ci
npm run tauri dev
npm test
npm run build
```

The static deployment artifact is `dist/site/`. Pushing `main` publishes it through the factory static deployment. Desktop packages remain built by the repository’s tag-triggered GitHub Actions release workflow.

## Known operator action

Enable the registered `clipboard-lan-bridge` product in the Sociobot billing service, verify its hosted checkout and return URL, then replace the current honest unavailable state with the `$9 once` purchase action. This is intentionally not a repository repair because the current product-scoped checkout endpoint returns the documented operator-gated 404.
