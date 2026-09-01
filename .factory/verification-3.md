# Independent product verification 3

## Verdict: FAIL

- Candidate: `da6cdd4e84ce73f997c82b71da14cc1f52f7f5cc`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-01 UTC
- Work order: `clipboard-lan-bridge-verify-3`

The core local-transfer product, demo, static deployment, release packages, and request allowances work. The candidate is not accepted because the required one-time purchase cannot be started, published data-handling statements are missing claim entries, and keyboard and touch checks found contract gaps.

## Release-blocking findings

### High — the advertised one-time Route pass cannot be purchased

The page advertises a `$9 once` Personal Route pass but provides no purchase action. A fresh request to the product-scoped checkout URL returned HTTP 404:

```json
{"error":"enabled factory product","status":404}
```

The page now explains that checkout is temporarily unavailable, so it no longer sends a customer to a dead action. That is an honest recovery state, but it does not satisfy the researched one-time monetization requirement or the paid-unlock requirement for a working Sociobot checkout link.

Required result: enable the product in the Sociobot billing service, confirm the hosted checkout starts, and restore the buy link with the stated price and return URL.

### High — two published data-handling statements are not represented in `claims.json`

All 18 declared claim commands pass after the documented install. Cross-checking the live copy, privacy page, and README found additional statements that a visitor may rely on:

- `README.md:19` and the privacy page say clipboard writes occur only after the user chooses the copy action. `no-clipboard-monitoring` checks reads only; no claim entry confirms the write behavior.
- `README.md:20` and the privacy page say identities and peer keys remain in app data while active tickets remain only in memory. No claim entry checks the persistence boundary.

The claims contract requires each such statement to have one tagged test or be removed. These omissions make the claims gate incomplete even though every listed command passes.

## Other defects

### Medium — skip links do not move keyboard focus into main content

On the live `/demo/` page at 390 px with reduced motion, the first Tab correctly revealed **Skip to main content** with a designed focus ring. Pressing Enter changed the location target but left `document.activeElement` outside `main`. The next Tab therefore resumes in the header instead of continuing in the main content.

The same markup pattern uses `href="#main"` with a non-focusable `<main id="main">`. Make the destination programmatically focusable and move focus there when the skip link is used.

### Medium — one landing-page touch target is narrower than 44 CSS pixels

The footer **Terms** link measured `43.656 × 44` CSS pixels at both 1440 × 900 and 390 × 844. The repository regression checks only height, so it does not detect this width gap. The attached product contract requires targets to be at least 44 × 44 CSS pixels.

### Medium — phone background limits are not stated clearly

The brief requires mobile background limits to be clear. The current copy says both devices must remain on the LAN and mentions sleeping devices only in Terms. It does not tell a phone user that browser background scheduling may pause polling and that the companion page may need to remain open.

### Low — handled invalid phone input adds a browser console error

On the released phone companion, a one-character phone name shows the useful recovery message `Use a valid phone name and identity.`. Chromium also records `Failed to load resource: the server responded with a status of 400 (Bad Request)` for that handled request. Valid input immediately recovered and displayed a six-character pairing code. Page errors remained empty.

### Low — secondary routes do not use the required common site frame

The demo has no footer. Privacy, Terms, and 404 use a reduced header instead of the common wordmark and navigation, and the 404 footer has no Privacy or Terms links. The demo and legal pages also omit the root page's Open Graph, Twitter-card, and apple-touch metadata. Titles, descriptions, canonical links on real routes, and the designed 404 otherwise work.

### Low — Rust formatting and one README sentence need cleanup

- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` reports formatting differences in `src-tauri/src/lib.rs` near lines 186, 809, and 1671.
- `README.md:50` says `Build a local desktop package with.` and leaves the instruction incomplete.

## Mandatory claims gate

`.factory/claims.json` exists with 18 entries. The browser commands initially could not resolve `@playwright/test` before dependencies were installed. After the required `npm ci`, every listed command was rerun exactly; all passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `release-packages` | PASS | Node release-policy test passed. |
| `platform-download` | PASS | Two Playwright project executions passed. |
| `sample-demo` | PASS | Two Playwright project executions passed. |
| `lan-only` | PASS | Native transfer lifecycle test passed. |
| `end-to-end-encryption` | PASS | Authenticated transfer and metadata test passed. |
| `explicit-pairing` | PASS | Native pairing lifecycle test passed. |
| `phone-companion` | PASS | Phone cryptography round trip passed. |
| `companion-api-allowance` | PASS | Native allowance test passed. |
| `no-clipboard-monitoring` | PASS | Two Playwright project executions passed. |
| `text-32kb` | PASS | Two Playwright project executions passed. |
| `expiry` | PASS | Two Playwright project executions passed. |
| `no-telemetry` | PASS | Two Playwright project executions passed. |
| `no-account` | PASS | Two Playwright project executions passed. |
| `two-device-free-tier` | PASS | Native free-tier limit test passed. |
| `paid-route-pass` | PASS | Native entitlement limit test passed. |
| `native-license-verification` | PASS | Two Playwright project executions passed. |
| `license-handoff` | PASS | Two Playwright project executions passed. |
| `checkout-status` | PASS | Two Playwright project executions passed. |

The two unlisted statements above remain a claims-contract failure.

## First-read check

PASS at 1440 × 900 and 390 × 844.

- What it does: **Send text to nearby devices**.
- For whom and when: people moving one link, address, or note between their phone and computers on the same local network.
- What to choose first: **Try it with sample data** is visible without scrolling.
- One click opens `/demo/` with a persistent demo banner, two paired sample devices, prepared text, and a grocery-list arrival.

Evidence: `evidence/verification-3/first-read-desktop.png`, `live-mobile.png`, and `live-demo-mobile.png`.

## Clean checkout verification

The checkout began at the exact candidate SHA.

- `npm ci`: PASS; 67 packages audited, 0 vulnerabilities.
- `npm test`: PASS; 3 Vitest tests, 3 Node tests, 36 Playwright executions, and 7 Rust tests.
- `npm run check`: PASS; TypeScript and native core checks.
- `npm run build`: PASS; produced `dist/app/` and `dist/site/`.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings`: PASS after installing the README's Linux GUI prerequisites.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`: FAIL with formatting-only differences listed above.

Production sizes:

- Landing JavaScript: 3,773 bytes plus a 711-byte module helper; 2,063 bytes gzip combined.
- Landing CSS: 10,085 bytes raw / 2,910 bytes gzip.
- Demo JavaScript: 2,288 bytes raw.
- Mobile hero: 32,472 bytes; desktop hero: 65,808 bytes.
- Desktop webview JavaScript: 14,745 bytes raw / 5,350 bytes gzip.
- Desktop webview CSS: 10,182 bytes raw / 3,070 bytes gzip.
- No web font files are shipped.

## Functional and recovery checks

The live demo was exercised in a fresh 390 × 844 browser context.

- Normal sample handoff, two-minute expiry, copy feedback, reset, and **Start for real** cleanup: PASS.
- Blank input: PASS recovery message and focus return.
- Exactly 32,768 ASCII bytes: PASS.
- 32,769 ASCII bytes: PASS rejection.
- 8,193 four-byte Unicode characters: PASS rejection.
- Markup-like text: PASS as visible text with no interpreted element.
- Demo isolation: PASS; the ticket key was only `demo:clipboard-lan-bridge:tickets` in session storage. No real ticket key appeared.
- Direct demo request log: only `https://clipboard-lan-bridge.sociobot.in`.
- Landing request log: product origin plus the documented GitHub releases API. No external font, script, analytics, advertising, or telemetry request appeared.
- Live checkout-return handling: PASS URL cleanup, namespaced license storage, clipboard copy, visible feedback, and no page error.

The released Linux companion page loaded at 390 px with one h1, one main landmark, no overflow, and zero serious/critical Axe findings. Invalid input recovered to a valid six-character pairing code. All companion page requests remained on its local origin.

## Request allowances

- Released LAN companion: 30 requests from one client in 10 seconds returned 200; request 31 returned 429 with `Retry-After: 10` and `Cache-Control: no-store`.
- Concurrent LAN check: 40 simultaneous requests from one client produced exactly 30 responses with 200 and 10 with 429.
- Product-scoped Sociobot license verification: 30 short-window requests returned 200; request 31 returned 429 with `Retry-After: 2`.

The companion router applies its shared allowance middleware to the page, assets, pairing, status, send, and inbox routes. No sign-in is used, so the Microsoft Entra tenant requirement is not applicable.

## Live deployment and release identity

- Twenty-one public files in `dist/site/` matched the live responses byte for byte. `staticwebapp.config.json` correctly remains non-public.
- Root SHA-256: `375eb498c872f776b9acd3bbbc80b1310e694f223d5d3e347a08cf513b7b7879`.
- Service worker SHA-256: `5ab592ef739358ccee86e9f6be2f9546da27d8ba427b1a4549582c999bd06f27`.
- Release `v0.1.4` contains Linux AppImage/DEB/RPM, Windows MSI/EXE, macOS arm64/x86_64 DMGs, `SHA256SUMS`, and `latest.json`.
- The release workflow completed successfully. Its manifest records source commit `f0df71ba3d299763e843a6723603125fbcbf03ee`.
- Candidate `da6cdd4e84ce73f997c82b71da14cc1f52f7f5cc` differs from that tag only in `.factory/handoff.md`; all product and build inputs are identical.
- Downloaded DEB SHA-256: `af12f63af15e430bd9b503f31bd2563592cfc9a873042342bb03bf8a393e88d4`, matching both release manifests.
- The live shell installer completed in an isolated directory and installed an executable AppImage with SHA-256 `5c57c30ce8cf99dceac33957c172d5f8606407df9734a1a8ee0c77ab31a6742c`.
- The AppImage remained running for the 12-second launch check using its supported extract-and-run mode. The container has no FUSE device.
- Live operating-system selection chose the v0.1.4 AppImage for Linux, MSI for Windows, and x86_64 DMG for macOS without console or page errors.
- The link crawl found successful internal routes and repository pages; the selected package returned the expected download redirect.

## Accessibility, headers, offline behavior, and performance

- `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404 had `lang=en`, one h1, one main landmark, alt text where needed, and no horizontal overflow at desktop or 390 px.
- Axe reported zero serious/critical findings on those routes at both sizes and on the released phone companion.
- At 200% root text size on 390 px, the public pages had no horizontal overflow or clipped element bounds.
- Visible focus used a two-ring treatment. Reduced-motion mode had no running animation and computed smooth scrolling as `auto`.
- Successful public routes and the main demo flow had no console or page errors. The handled phone-name response is noted above.
- Headers included CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, `no-referrer`, and restrictive camera, microphone, and geolocation policy.
- HTML caching was `public, must-revalidate, max-age=30`; hashed assets were one year and immutable; the service worker and installers were `no-cache`.
- Service-worker update behavior removed an injected old cache and retained `clipboard-lan-bridge-v4`. Offline `/demo/` reload returned 200 with its banner and data and no console error.
- Fresh live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0.

Evidence is under `.factory/evidence/verification-3/`, including live screenshots, the Lighthouse JSON, and the independent Playwright scripts. The repository has no `verify-url.sh`; equivalent live title, language, main, h1, alt, console, and Axe checks are in `live-qa.mjs`.

## Scope notes

- The product has no AI feature, and the brief does not identify a useful AI step.
- This is not a library or CLI package, so clean-consumer API installation does not apply.
- No account flow exists.
- No infrastructure, DNS, billing configuration, database, secret store, or unrelated service was read or changed.

## Required before PASS

1. Enable and confirm the Sociobot checkout, then restore a working purchase action.
2. Add tagged claims for explicit clipboard writes and persistence boundaries, or remove those statements.
3. Make skip-link activation place focus on main content.
4. Make every interactive target at least 44 × 44 CSS pixels and strengthen the regression to check both dimensions.
5. Explain phone-browser background behavior in the phone companion, landing page, and README.
6. Bring secondary routes into the required common site frame and complete their metadata.
7. Run Rust formatting and repair the incomplete README sentence.
