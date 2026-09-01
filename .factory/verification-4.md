# Independent product verification 4

## Verdict: FAIL

- Candidate commit: `7eacbfe4dd6d3039b722b4fbce441b09f89643f3`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-01 UTC
- Work order: `clipboard-lan-bridge-verify-4`

The public website is healthy and matches the candidate's static production output. The candidate is not accepted because the advertised one-time purchase cannot be started and the downloadable desktop packages are not built from the candidate commit.

## Release-blocking findings

### High — the advertised $9 Route pass has no available purchase path

The landing page displays a `$9 once` Personal Route pass, but shows "Checkout is temporarily unavailable" and provides no checkout action. A fresh product-scoped request to `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` returned HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

This does not meet the researched one-time monetization requirement or the paid-unlock requirement for a product-scoped hosted checkout.

Required result: enable the scoped product in the billing service, confirm that hosted checkout starts and returns a license, then publish the stated purchase action.

### High — downloadable desktop packages are from an older source commit

The live site selected valid v0.1.4 Linux, Windows, and macOS package URLs without browser errors. The published `latest.json` inside that release records source commit `f0df71ba3d299763e843a6723603125fbcbf03ee`; the candidate is seven commits later at `7eacbfe4dd6d3039b722b4fbce441b09f89643f3`.

This is a material package difference: candidate changes after v0.1.4 include the phone-companion background guidance and local phone-name validation. The website's static files match the candidate, but a visitor downloading the desktop app receives the v0.1.4 package rather than this candidate.

Required result: tag and publish desktop packages from the accepted candidate (or the exact final commit), update the bundled release manifest, and recheck package checksums and source identity.

## Mandatory claims gate

`.factory/claims.json` exists with 21 entries. After `npm ci`, every listed command was executed independently from the clean checkout. All passed. The complete `npm test` run also passed, with the final Playwright status recorded as `passed`.

| Claim | Result |
| --- | --- |
| `release-packages` | PASS |
| `platform-download` | PASS |
| `public-page-network-boundary` | PASS |
| `sample-demo` | PASS |
| `lan-only` | PASS |
| `end-to-end-encryption` | PASS |
| `explicit-pairing` | PASS |
| `phone-companion` | PASS |
| `companion-api-allowance` | PASS |
| `no-clipboard-monitoring` | PASS |
| `explicit-clipboard-write` | PASS |
| `app-data-boundary` | PASS |
| `text-32kb` | PASS |
| `expiry` | PASS |
| `no-telemetry` | PASS |
| `no-account` | PASS |
| `two-device-free-tier` | PASS |
| `paid-route-pass` | PASS |
| `native-license-verification` | PASS |
| `license-handoff` | PASS |
| `checkout-status` | PASS |

The published landing page and README were also reviewed against the manifest. The current privacy, pairing, size, expiry, license, and package statements have matching entries.

## First-read check

PASS at 1440 × 900 and 390 × 844 from a fresh browser context.

- What it does: **Send text to nearby devices**.
- For whom: people moving one link, address, or note between a phone and computers on the same local network.
- What to choose first: **Try it with sample data** is visible without scrolling.

One click opens `/demo/` with a persistent "Demo — sample data, nothing is saved" banner, paired sample devices, a realistic prepared message, reset controls, and a real-data exit path.

## Clean checkout and build checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | Installed 67 packages; audit reported 0 vulnerabilities. |
| Every declared claim command | PASS | 21 commands, run independently. |
| `npm test` | PASS | 3 Vitest tests, 4 Node release tests, 46 Playwright executions, and 8 native tests. |
| `npm run check` | PASS | TypeScript and native library checks passed. |
| `npm run build` | PASS | Produced `dist/app/` and `dist/site/`. |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS | No formatting differences. |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` | PASS | Passed after installing the documented Linux GUI development packages. |
| `git diff --check` | PASS | No whitespace errors. |

The production landing JavaScript is 5,066 bytes raw plus an 867-byte shared helper. Landing CSS is 10,100 bytes raw; the largest hero image is 65,808 bytes. No web-font files are shipped, so the static product is within its stated transfer budgets.

## Functional checks

The live demo was exercised in a fresh 390 × 844 browser context.

- Normal sample send, visible arrival, reset, and Start for real cleanup: PASS.
- Demo storage isolation: PASS. The ticket was stored only under `demo:clipboard-lan-bridge:tickets` in session storage; the real local-storage key was absent.
- Blank text: PASS. The recovery message was `Enter or paste something to send.`
- Exactly 32,768 ASCII bytes: PASS.
- 32,769 ASCII bytes and 8,193 four-byte Unicode characters: PASS. The recovery message was `Text must be 32 KB or less.`
- Markup-like input displayed as text rather than rendered content: PASS.
- Two-minute expiry, visible copy feedback, explicit clipboard read/write behavior, local data persistence boundary, pairing approval, encrypted transfer integrity, and free/paid limits: PASS through their dedicated browser and native claim checks.
- LAN companion allowance: PASS. The native companion test observed 30 requests from one client IP in 10 seconds, then HTTP 429 with a positive `Retry-After` header.
- No account flow is present, so the Microsoft Entra tenant requirement does not apply.

## Live deployment, privacy, accessibility, and performance

- `dist/site/index.html` and `dist/site/demo/index.html` matched the corresponding live responses byte for byte. Root SHA-256 was `c5a3d474f4a86030c1ad7388a9ba4cf00d568b79bd730d65aada722db1ebc1ee`; demo SHA-256 was `6a82fade4dd15e8d4f55b50ad2f33ccd737b54fb883c69b75bace57df72ef1af`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404 page had the expected title, `lang="en"`, one h1, one main landmark, no horizontal overflow, and zero Axe serious or critical findings at desktop and 390 px.
- `verify-url.sh` passed for root, demo, privacy, and terms with no console errors and no missing image alt attributes.
- Keyboard checks passed: the first Tab reaches Skip to main content, Enter moves focus to main, and every visible link, button, and summary measured at least 44 × 44 CSS pixels.
- Reduced motion computed `scroll-behavior: auto`. The live demo service worker registered `clipboard-lan-bridge-v6`; an offline `/demo/` reload returned 200, retained the demo banner, and produced no browser errors.
- During cold landing, demo, privacy, and terms use plus the demo send flow, outgoing browser requests stayed on `https://clipboard-lan-bridge.sociobot.in`. No analytics, advertising, font CDN, GitHub API, console error, or page error was observed. The deliberate unknown-route check returned 404 and was excluded from that page-error result.
- Response headers included HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive camera/microphone/geolocation policy, and CSP with `frame-ancestors 'none'`. Hashed assets were one-year immutable; HTML was 30-second must-revalidate; the service worker and installers were no-cache.
- Fresh live mobile Lighthouse reported Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, CLS 0, and total blocking time 80 ms. Lighthouse emitted a post-report browser-tab crash notice but wrote a complete scored report; the independent Playwright browser checks completed without error.

## Release package checks

- The v0.1.4 GitHub release contains Linux AppImage/DEB/RPM, Windows MSI/EXE, macOS arm64/x86_64 DMGs, `SHA256SUMS`, and `latest.json`.
- A fresh 5,207,972-byte Linux DEB download had SHA-256 `af12f63af15e430bd9b503f31bd2563592cfc9a873042342bb03bf8a393e88d4`, matching the bundled manifest.
- Live operating-system selection chose the AppImage for Linux, MSI for Windows, and x86_64 DMG for macOS. Each page load had no console errors.
- The live link crawl returned 200 for all internal links, the selected Linux package, and the source repository.

Evidence is in `.factory/evidence/verification-4/`, including live responses, headers, browser screenshots, the release metadata, checkout response, and Lighthouse report.

## Scope notes

- The brief does not identify a useful model-assisted action, so no AI capability is required.
- This is a desktop application, not a library or CLI; clean-consumer package API checks do not apply.
- No product code, deployment, billing configuration, DNS, unrelated service, database, or secret store was changed during verification.

## Required before PASS

1. Enable the product-scoped checkout and verify a complete purchase/return/license path.
2. Publish a new signed-checksum desktop release whose `latest.json` source commit is the final accepted candidate, then update the site's bundled manifest.
