# Independent product verification 10

## Verdict: PASS

- Candidate commit: `5f9dea0b41666ff6da08f1dbea9b82f9c29b86e8`
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>
- Verified: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-verify-10`

No product code was changed during this verification.

## Cold read and demo

**PASS.** A fresh desktop load states: **“Send text to nearby devices”** and “Move one link, address, or note between your phone and computers on the same local network.” This plainly answers what it does, who it is for, and why. **Try it with sample data** is the first primary action and opens `/demo/` in one click.

The live demo shows the persistent **“Demo — sample data, nothing is saved”** banner, Reset demo, and the start-for-real/download action. It displays a paired Kitchen phone, a realistic grocery arrival, and an editable rail-booking handoff. The independent suite exercised normal send, blank-input recovery, 32,768-byte acceptance, 32,769-byte and four-byte-character rejection, two- and ten-minute expiry, reset, and discarding the `demo:` session key on exit. It does not write the real-data namespace.

## Mandatory claims gate

**PASS — 24/24 declared claim commands passed from this clean checkout.** `.factory/claims.json` exists. After `npm ci`, every `test` command in it was executed exactly as declared, including both release commands, each individually listed Playwright command, and every native Rust command.

This verified release checksums/provenance, download state, isolated sample and desktop samples, direct encrypted local transfer, metadata authentication, receiving-device pairing approval, phone companion crypto, clipboard consent, persistence boundaries, text limits, expiry, privacy/no telemetry/no account, plan limits, and native license recovery/verification. The native allowance claim observed 30 requests from one client in 10 seconds followed by `429 Too Many Requests` with `Retry-After`.

There is no sign-in flow; the Entra requirement is not applicable.

## Local quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 0 vulnerabilities reported |
| `npm test` | PASS — 3 Vitest, 3 Node release, 52 Playwright, 8 Rust tests |
| `npm run check` | PASS — TypeScript plus Rust core check |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings` | PASS |
| `npm run build` | PASS — generated `dist/app/` and `dist/site/` |

The production site is well within static budgets: initial landing JavaScript is 5,224 bytes raw / 2,065 bytes gzip, CSS is 10,590 bytes raw / 2,969 bytes gzip, the mobile hero is 32,472 bytes, and the desktop hero is 65,808 bytes. A standalone Lighthouse invocation could not attach to Chrome in this container; the direct Playwright load, axe, layout, console, and byte-budget checks below all passed.

## Live deployment, privacy, and accessibility

**PASS.** `a97c9fd` (the v0.1.11 release source) is an ancestor of this documentation-only candidate. Fresh local production output matched production byte-for-byte for `main-CFMyZAL9.js`, `main-D7ow-PwQ.css`, `a11y-BggcmIuC.js`, and `demo-Vy4Rqfdc.js`.

- `/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, crawler files, and both installer scripts returned 200; all crawled internal/external links returned 200.
- Cold desktop and 390 px mobile loads have `lang=en`, a title, exactly one `h1`, a `main` landmark, no image without alt text, no horizontal overflow, and no console/page errors. Tab first reaches the visible skip-link focus ring.
- Playwright axe found **zero serious or critical** findings on live desktop, mobile, demo, and reduced-motion views. The standalone axe CLI could not create its unavailable system-Chrome session; this is a container limitation, not an axe finding.
- `prefers-reduced-motion` produced no active animations/transitions. The full 52-case browser suite also covered keyboard navigation, focus restoration, 200% text, targets, accessibility, and invalid-phone recovery.
- Live landing/demo request logs contained only `https://clipboard-lan-bridge.sociobot.in`; no telemetry, analytics, advertising, third-party fonts, CDN, GitHub API, or billing request ran. No public user data is sent off-origin.
- Headers include HSTS, `nosniff`, `no-referrer`, restrictive Permissions-Policy, and CSP with `default-src 'self'`, `connect-src 'self' https://api.sociobot.in`, and response-header `frame-ancestors 'none'`. HTML is revalidated after 30 seconds, hashed assets are immutable for one year, and `sw.js` is `no-cache`.
- The registered service worker controls the page, handles an explicit `registration.update()` without error, and reloaded the live landing page offline with status 200, the correct title/h1, and no errors.

The published v0.1.11 manifest lists validated Linux, macOS, and Windows packages. The release claim downloaded packages and compared their SHA-256 values against `latest.json` and `SHA256SUMS`. The selected Linux AppImage link returned 200. Unsigned-package warnings are visible and correctly explained.

## Defects by severity

None found.

## Known product/operator limits

- New license sales are intentionally unavailable; existing-license restore remains available and is covered by claims.
- Current packages are unsigned. The site clearly warns about operating-system publisher warnings; future signing requires the operator certificates documented in the handoff.
