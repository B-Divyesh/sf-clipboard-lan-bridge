# Independent product verification 5

## Verdict: FAIL

- Candidate commit: `c7271bc7818695e3a3caab69b9aa66924ed249f9`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-01 UTC
- Work order: `clipboard-lan-bridge-verify-5`

The previous desktop-package blocker is fixed. Release `v0.1.6` was built from the exact candidate and the live site selects its real Linux, Windows, and macOS packages. The free LAN handoff, sample flow, privacy boundary, accessibility, offline behavior, rate limits, build, and release checks pass.

The candidate is not accepted because the researched one-time purchase still cannot be started. The landing page advertises a `$9 once` Personal Route pass but offers no purchase link, and a fresh request to the required scoped checkout endpoint returns HTTP 404.

## Release-blocking finding

### High — the advertised $9 Route pass cannot be purchased

The landing page, app, README, and terms describe a `$9` one-time Personal Route pass. The live page instead says `Checkout is temporarily unavailable` and contains no checkout link. A fresh request to:

`https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout`

returned HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

This fails the researched one-time monetization contract and the paid-unlock requirement for a product-scoped hosted checkout. Existing-license verification works, but it cannot replace a way for a new buyer to obtain a license. Evidence: `evidence/verification-5/checkout-headers.txt` and `checkout-body.json`.

Required result: enable the scoped product registration, expose the hosted checkout link, and verify checkout → return token → installed-app restore end to end. No shared billing resource was modified during verification.

No other release-blocking defect was found.

## Mandatory claim gate

`.factory/claims.json` exists, has 21 unique entries, and each claim has exactly one matching `@claim:<id>` test. After the declared install, every listed command was run independently at the exact candidate commit. All passed.

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

The checkout-status claim correctly proves that the UI does not expose a dead checkout. That honesty does not satisfy the separate monetization acceptance requirement.

The clone initially opened at the supplied base rather than the candidate. That precondition was detected, the tree was detached at `c7271bc…`, and the entire claim gate was restarted. The acceptance results above are from the candidate run. The install used the same lockfile; later commits changed only release-manifest/test expectations and factory evidence.

Evidence: `evidence/verification-5/claims.log`.

## First-read gate

PASS from a cold, storage-empty live context at 1440 × 900 and 390 × 844.

- What it does: **Send text to nearby devices**.
- For whom: people moving one link, address, or note between their phone and computers on the same local network.
- What to choose first: **Try it with sample data**, visible without scrolling.

One click opens `/demo/`, which immediately shows two named sample devices, prepared and received text, a persistent `Demo — sample data, nothing is saved` banner, **Reset demo**, and **Start for real**.

## Clean checkout, tests, and build

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 67 packages installed; 0 audit vulnerabilities. |
| Every `.factory/claims.json` command | PASS | 21/21. |
| `npm test` | PASS | 3 Vitest, 5 release/provenance, 46 Playwright, and 8 Rust tests. |
| `npm run check` | PASS | TypeScript and no-default-features Rust checks. |
| `npm run build` | PASS | Produced `dist/app/` and `dist/site/`. |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS | No formatting changes. |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` | PASS | Passed after installing the README-listed Linux GUI prerequisites. |
| `git diff --check` | PASS | No whitespace errors before report edits. |

The exact production build emitted 14.75 KB app JavaScript and 10.18 KB app CSS. The plain candidate landing bundle was 4.82 KB JavaScript plus a shared 0.87 KB helper and 10.10 KB CSS. The largest hero image is 65.81 KB. These are below the 200 KB JavaScript, 50 KB CSS, and 300 KB hero-image budgets.

## End-to-end and edge-case checks

The live demo and native core were exercised with representative, boundary, invalid, and recovery cases.

- Realistic prepared handoff, new send, arrival, explicit copy feedback, reset, and Start for real cleanup: PASS.
- Demo storage isolation: PASS. Only `demo:clipboard-lan-bridge:tickets` appeared in session storage; the real-data key was absent.
- Blank input: PASS with `Enter or paste something to send.` and focus returned to the field.
- Exactly 32,768 ASCII bytes: accepted. 8,193 four-byte Unicode characters: rejected with `Text must be 32 KB or less.`
- Markup-like input: displayed as text; no injected element was created.
- Two-minute expiry: applied and displayed.
- Clipboard read/write only after the named actions: PASS through dedicated claim tests.
- Pairing approval, replay rejection, expiry rejection, changed-ciphertext/metadata rejection, peer limits, paid expiry limits, and persistence boundaries: PASS through native tests.
- No sign-in exists, so the Microsoft Entra tenant condition does not apply.

## Packaged desktop application

GitHub Actions release run `33568179450` completed successfully for Linux, Windows, macOS arm64, macOS x86_64, and publish. Annotated tag `v0.1.6` resolves to the exact candidate. The release contains AppImage, DEB, RPM, MSI, EXE, both DMGs, `SHA256SUMS`, and `latest.json`.

Every asset digest agrees across GitHub's release metadata, `SHA256SUMS`, and `latest.json`. A fresh 5,208,030-byte Linux DEB download matched SHA-256 `859e13fd0a668fb4b25f909eb8318ea7f8d8c41a64c46cab7951b0ed867b2dcb`.

The real Linux installer was run with an isolated `XDG_BIN_HOME`. It downloaded the 80,075,256-byte AppImage, verified SHA-256 `c9e64ff8302da9ddd56439accb2ad2664bfb781acb2a79292f9fdc064fe3fd29`, and installed it into that temporary directory.

The downloaded DEB was extracted and launched under a headless X display. Its real binary stayed running and served the phone companion on port 38743. The packaged companion returned 200, showed correct semantics at 390 px, had zero serious/critical Axe findings, handled an invalid one-character phone name locally, generated a six-character pairing code for a valid name, stored only its two documented local keys, stayed same-origin, and emitted no console/page errors. Headless GTK logged expected missing-session-bus and software-rendering warnings; the app and companion remained operational.

## Rate limits

- Packaged LAN companion: the first 30 requests from one loopback client succeeded; request 31 returned HTTP 429 with `Retry-After: 10`, matching the documented 30 requests per client IP per 10 seconds.
- Sociobot product license verifier: the first 30 requests succeeded; request 31 returned HTTP 429 with `Retry-After: 3` and `X-RateLimit-After: 3`.

Evidence: `companion-rate-codes.txt`, `companion-rate-429-headers.txt`, `billing-rate-codes.txt`, and `billing-rate-429-headers.txt`.

## Deployment identity

The live deployment is the candidate plus immutable release metadata generated after the candidate tag:

- `v0.1.6` and `latest.json` name `c7271bc7818695e3a3caab69b9aa66924ed249f9` as the source commit.
- The only functional post-candidate source change before deployment replaced the draft release manifest with the workflow-produced URLs/checksums and updated its two test expectations. Later changes were factory evidence and handoff text.
- A fresh temporary rebuild of candidate `c7271bc…` with the published `latest.json` produced byte-identical live HTML, JavaScript, CSS, images, service worker, installers, crawler files, and legal/demo pages. Root SHA-256 was `3c96973f2f77f4a6c37fa8f8ed5bc2699b673be7b27ed9eddfef6a7fcddea09d` locally and live. `staticwebapp.config.json` is deployment configuration and correctly is not publicly served.

This confirms the live product code and downloadable binaries derive from the candidate; the live-only data difference is the expected post-build release manifest.

## Live accessibility, privacy, headers, and performance

The independent live harness passed 91/91 checks.

- `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404 were checked on desktop and 390 px mobile.
- Each page has `lang="en"`, a specific title, exactly one h1, one main landmark, complete image alt attributes, no horizontal overflow, and no sub-44-pixel visible link/button/summary target.
- Axe reported zero serious or critical findings on every checked route and viewport.
- At 200% text size, the 390 px landing page had no horizontal overflow or clipped content.
- Keyboard use reached the skip link first, showed a designed focus ring, moved focus to main on Enter, and reached all visible demo controls without a trap.
- Reduced motion computed `scroll-behavior: auto` with zero running animations.
- Service-worker update removed a seeded old cache, activated `clipboard-lan-bridge-v7`, and reloaded `/demo/` offline with no browser error.
- Cold public pages and the complete demo flow requested only `https://clipboard-lan-bridge.sociobot.in`; no analytics, advertising, CDN font, GitHub API, failed request, console error, or page error appeared.
- The live link crawl found no failing target. Package navigation redirected normally to GitHub's release asset host.
- HTML is cached for 30 seconds with revalidation; hashed JavaScript is cached for one year and immutable; the service worker and installer are `no-cache`.
- Response headers include HSTS, `nosniff`, `Referrer-Policy: no-referrer`, disabled camera/microphone/geolocation, and a restrictive CSP with `frame-ancestors 'none'` and `connect-src 'self'`.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 20 ms, CLS 0.

The standard `/opt/fleet/lib/verify-url.sh` also passed root, demo, privacy, and terms with no browser errors.

## Claim/copy and scope review

The live landing, privacy, terms, README, and app copy were cross-checked with the claims manifest. Material statements about release packages, platform choice, same-origin public pages, demo isolation, LAN-only encrypted transfer, pairing, phone support, clipboard access, storage, 32 KB limits, expiry, telemetry, account requirements, tier limits, native verification, license handoff, and checkout status have matching claim entries. No unsupported quantitative performance promise is published.

The brief does not imply a useful model-assisted step; no AI feature is missing. This is a desktop app, not a library or CLI, so clean-consumer package API checks do not apply.

## Evidence index

Primary evidence is under `.factory/evidence/verification-5/`:

- `claims.log`, `npm-test.log`, `check.log`, `build.log`, `cargo-fmt.log`, `cargo-clippy.log`
- `live-qa.json` and `live-qa.mjs`; desktop/mobile and demo screenshots
- `lighthouse-live.json`; URL-verifier HTML, screenshots, and JSON
- `packaged-companion-qa.json`, script, and screenshot
- `release-workflow.json`, `release-cross-check.json`, release/tag metadata, `SHA256SUMS`
- checkout, verifier, cache, companion-limit, and billing-limit response evidence
- `link-qa.json` and Linux installer output

## Required before PASS

Enable the scoped Sociobot checkout, expose the `$9` purchase action, and independently verify purchase, return token handling, native restore, and revocation. Then rerun verification. No product code, deployment, DNS, billing service, secrets, or unrelated resources were modified in this verification.
