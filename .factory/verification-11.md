# Send text to nearby devices — independent verification 11

## Verdict: FAIL

- Candidate implementation: `85e17b7f753a076f6c508f06bf5a697b9052e16f`
- Candidate documentation: `c87de593b5f3a0dbce3800419c0dd247d84e6c34`
- Live deployment: `2175ff9d-c69e-4973-91ed-488976d26e19`
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>
- Verified: 2026-09-05 UTC
- Finding count: 1
- Untested public claims: 0

No product code was changed for this verification.

## First screen before scrolling

| Viewport | Job | Audience | First action | Result |
| --- | --- | --- | --- | --- |
| 1440 × 900 | Send text to nearby devices. | People moving a link, address, or note between their phone and computers on one local network. | **Try it with sample data** at y=651, inside the first viewport. | PASS |
| 390 × 844 | Send text to nearby devices. | People moving a link, address, or note between their phone and computers on one local network. | **Try it with sample data** at y=463, inside the first viewport. | PASS |

Fresh phone and desktop contexts both loaded with title `Clipboard LAN Bridge — send text to nearby devices`, `lang=en`, one h1, one main landmark, no horizontal overflow, no console or page error, and only the product origin in their ordinary request logs.

## Finding

### P1 — New one-time licenses cannot be purchased

The source brief still specifies one-time monetization. The live site accurately says **Not for sale** and disables purchase controls, but a direct request to the required product-scoped checkout returned HTTP 404 on 2026-09-05. A new visitor therefore cannot obtain the paid entitlement described for existing license holders.

This is the unresolved F-1-7. It is not a defect in the deliberate disabled control and it is not an untested claim: `purchase-unavailable` passed. It is a product-scope blocker until the operator registers and enables `clipboard-lan-bridge` in Sociobot billing, sets the production return URL, and the checkout → returned token → native verification journey is tested end to end. No fake purchase path was added.

## Demo and user paths

PASS. A clean mobile context opened `/demo/` directly. The persistent banner says **Demo — sample data, nothing is saved**. The visible sample includes a Kitchen phone, a grocery arrival, and a realistic rail-booking handoff.

- A normal sample send created the expected ticket.
- Blank input reported `Enter or paste something to send.`
- **Reset demo** removed the sent ticket and restored the sample state.
- Demo storage remained in `sessionStorage["demo:clipboard-lan-bridge:tickets"]`; `localStorage["clipboard-lan-bridge:tickets"]` was null.
- **Download the desktop app** discarded the demo state, moved to `/#download`, and focused **Install the desktop app**.
- The declared browser claims additionally passed normal, invalid, exact 32,768-byte, 32,769-byte, 8,193-four-byte-character, expiry, clipboard-consent, pairing, recovery, and offline paths.

## Claims and local quality gates

PASS. From an isolated checkout at documentation commit `c87de59` after `npm ci`, every one of the 23 entries in `.factory/claims.json` was run exactly as declared and passed. The registry has unique IDs and every public claim reviewed on the landing page, legal pages, and README has a matching entry. The deliberately unavailable purchase state is covered by `purchase-unavailable`; it does not remove the product-scope finding above.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 67 packages, 0 audit vulnerabilities |
| 23 declared claim commands | PASS — including release packages/provenance, privacy boundary, demo isolation, native LAN/encryption/pairing paths, companion rate limit, clipboard consent, limits, expiry, and license recovery |
| `npm test` | PASS — 3 Vitest, 3 Node release, 52 Playwright, and 8 Rust tests |
| `npm run check` | PASS |
| `npm run build` | PASS — produced `dist/app/` and `dist/site/` |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings` | PASS |

The production build is within the stated static budgets: landing JavaScript is 5.22 KB raw / 2.05 KB gzip, landing CSS is 10.59 KB raw / 2.96 KB gzip, and the largest hero image remains below 300 KB.

## Live site, privacy, and accessibility

PASS.

- Fresh live axe checks found zero serious or critical findings on root and demo at 1440 px and 390 px, and on privacy, terms, and 404 at desktop width.
- Keyboard Tab reaches the skip link; Enter moves focus to main. Reduced-motion contexts have no nonzero animation or transition duration.
- The service worker controlled the demo and reloaded it offline with its title and sample banner intact and no console errors.
- The license-return state made exactly one off-origin request: the documented `GET https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?...`; its token was removed from the address bar. Ordinary public pages remained product-origin only.
- `/`, `/demo/`, `/privacy/`, `/terms/`, and the source and selected AppImage links returned 200. An unknown live route returned the designed 404 with HTTP 404. Route titles were specific.
- Live headers include HSTS, `nosniff`, `no-referrer`, restrictive Permissions-Policy, and a CSP whose `connect-src` allows only self plus the documented Sociobot verification service.
- A production rebuild of the candidate matched all 25 publicly served static files byte-for-byte. The only excluded local output, `staticwebapp.config.json`, is deployment configuration and is intentionally not publicly served.

## Installed desktop artifact

PASS. In a clean consumer directory, the public v0.1.11 Linux AppImage SHA-256 was `369493702c681d80e70483bb49500a4d0c16f832a59580493408975ba18b0656`, matching `latest.json`. After installing the README-linked Tauri Linux runtime prerequisites in this disposable container, the artifact started under a headless display with isolated XDG data/config directories.

Its bundled phone companion returned 200, had title **Phone companion — Clipboard LAN Bridge**, and had one h1. A fresh allowance run made 30 successful `GET /api/status?device_id=...` requests; request 31 returned 429 and the next response carried `Retry-After: 10`.

## Earlier findings

| Earlier finding | Current disposition and proof |
| --- | --- |
| F-1-1 through F-1-6 | Fixed. The release, companion workflow, required approval, exact 32 KB boundary, expiry, and unsigned-package wording each have passing current claim coverage. |
| F-1-7 | **Unfixed — P1 above.** Live checkout remains HTTP 404 while the brief still requires one-time monetization. |
| F-1-8 through F-1-33 | Fixed. The current copy/claims review found no password-autofill, discovery-payload, unsupported algorithm, signing, factory-deployment, or generated-art public promise; routing, terminology, demo, install wording, checksum instructions, persistence, rate-limit, and provenance checks passed. |
| F-2-1 through F-2-10 | Fixed. Reset restores the complete sample; desktop sample and walkthrough exist; package wording is bounded; obsolete billing copy is absent; terminology, approval, 404, and demo exit behavior pass. |
| F-4-1 | Fixed by `85e17b7`. The claim now records all requests for a return-token state, permits only the exact Sociobot verification request, and the live interception check reproduced that one request and URL cleanup. |
| F-4-2 | Fixed by `85e17b7`. The unlisted GitHub Actions sentence is absent from the README. |
| Verification 7 P1s | Fixed. Aggregate `npm test` is green and Rust formatting passes. |
| Verifications 2–6 and 8–10 | No active defects beyond F-1-7. Their earlier demo, route, release, accessibility, privacy, and artifact results were rechecked by the commands and live checks above. |

## Required next action

Register and enable this exact product in Sociobot billing with return URL `https://clipboard-lan-bridge.sociobot.in/`. Then enable the real product-scoped buy link and independently test a successful hosted checkout, returned token, browser storage cleanup, and native verification. Until then the correct verdict is **FAIL**.
