# Independent product verification 9

## Verdict: PASS

- Candidate commit: `148e953f4870440e0581b1a4f8fd44c522a0a867`
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>
- Verified: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-verify-9`

No product code was changed in this verification.

## Cold read and demo

**PASS.** A cold production load says **“Send text to nearby devices”** and then: “Move one link, address, or note between your phone and computers on the same local network.” This plainly states the job, audience, and first action. **Try it with sample data** is above the fold and opens `/demo/` in one click.

The live demo has its persistent **Demo — sample data, nothing is saved** banner, Reset demo, and Start-for-real/download control. I completed a normal sample send, received it in the sample arrival list, got the helpful blank-input recovery (“Enter or paste something to send.”), got the 32,769-byte limit recovery (“Text must be 32 KB or less.”), and reset it. The sample reset the prepared rail-booking text and used only `sessionStorage["demo:clipboard-lan-bridge:tickets"]`; `localStorage` was empty.

## Mandatory claims gate

**PASS.** `.factory/claims.json` exists and contains 21 unique claim IDs. From this clean checkout, after `npm ci`, I ran every declared `test` command exactly as listed. This includes the two release tests; the individual Playwright claim runs (including the paid-unlock run listed twice for its two claims); and the individual native transfer, encryption, pairing, phone-companion, allowance, data-boundary, and plan-limit tests. All passed; the final Playwright result was `{"status":"passed","failedTests":[]}`.

The claim tests cover release/checksum/provenance, one-click sample isolation, normal and boundary demo behavior, explicit clipboard actions, no telemetry/account, direct authenticated local transfer, replay and expiry rejection, explicit receiver approval, phone crypto, local persistence limits, free/paid limits, and native license verification. The companion allowance test observed the documented limit: 30 successful requests from one client in 10 seconds, then `429 Too Many Requests` with a positive `Retry-After` response header. There is no sign-in flow, so the Entra tenant requirement is not applicable.

## Clean-checkout quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 67 packages audited, 0 vulnerabilities |
| `npm test` | PASS — 3 Vitest, 3 Node release, 51 Playwright, and 8 Rust tests |
| `npm run check` | PASS — TypeScript and Rust no-default-feature check |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings` | PASS |
| `npm run build` | PASS — produced `dist/app/` and `dist/site/` |

The production build is inside budget: landing JS is 5,224 bytes raw / 2.04 KB gzip, landing CSS is 10,379 bytes raw / 2.91 KB gzip, and the responsive desktop hero is 65,808 bytes. A mobile Lighthouse run recorded performance **92**, accessibility **100**, LCP **2.2 s**, and CLS **0**. (Chrome exited after report generation while capturing its final screenshot, but the completed JSON report had no run warnings and contains those category scores.)

## Live deployment, privacy, accessibility, and offline behavior

**PASS.** The fresh candidate build has byte-identical SHA-256 values to production for `index.html`, demo, privacy, terms, and 404 HTML plus all referenced main/a11y/demo JS and CSS bundles. The deployed release manifest names `v0.1.10` source commit `4fdad73…`, which is an ancestor of this candidate.

- Cold desktop and 390 px checks on `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404 route found exactly one `h1`, a `main` landmark, `lang=en`, correct route title, no horizontal overflow, and no normal-load console/page errors. The expected browser failed-resource console line is confined to requesting the 404 URL itself.
- Axe Playwright integration found **zero serious or critical findings** on all those desktop and mobile routes. Keyboard Tab reaches the skip link; Enter moves focus to `main`; the visible focus ring is the high-contrast ink/brass double ring. A reduced-motion context had zero nonzero animation/transition durations.
- Outgoing-request logs across the public routes and live demo contained only `https://clipboard-lan-bridge.sociobot.in`; no analytics, advertising, telemetry, third-party font/CDN, GitHub API, or billing request ran on page load or demo flow.
- Response headers include HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive Permissions-Policy, and CSP with `default-src 'self'`, `connect-src 'self' https://api.sociobot.in`, and response-header `frame-ancestors 'none'`. HTML has 30-second revalidation; hashed bundles have one-year immutable caching; `sw.js` is `no-cache`.
- Service-worker validation established a controller, reinstalled it after an unregister/update simulation, confirmed stale-cache cleanup, and reloaded `/demo/` offline with the demo banner visible and no errors.

## Defects by severity

None found.

## Notes

The release contains macOS, Windows, and Linux packages with SHA-256 checksums, as independently exercised by the release claim. Packages are correctly described as unsigned / potentially showing an unverified-publisher warning. The product is a desktop/Tauri application with a browser phone companion; no unrelated service, secret, database, or resource was accessed.
