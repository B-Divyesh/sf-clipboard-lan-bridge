# Independent product verification 6

## Verdict: PASS

- Candidate commit: `099d7517519f4a612e4f614360b85b726f6dda25`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-verify-6`

The candidate is accepted. Clipboard LAN Bridge provides a deliberate, local-only short-text handoff: explicit pairing, authenticated encrypted transfer, expiry, a mobile companion, and no clipboard surveillance or cloud relay. The public site, v0.1.7 desktop release, and deployed static files agree with the candidate.

## First-read gate

PASS from a cold live context at 1440 px and 390 px.

- **What it does:** “Send text to nearby devices.”
- **For whom:** a person moving one link, address, or note between their phone and computers on the same local network.
- **First action:** the above-fold **Try it with sample data** link.

That one click opens `/demo/` with named Studio laptop and Kitchen phone data, a prepared rail handoff, and the persistent **Demo — sample data, nothing is saved** banner with Reset demo and Start for real.

## Mandatory claims gate

`.factory/claims.json` is present with 19 unique claims. From this clean checkout, after `npm ci`, every command named in it was run through the documented demo/native entry point and passed:

| Claims | Result |
| --- | --- |
| release packages; platform download; public network boundary; sample demo | PASS |
| LAN-only transfer; end-to-end encryption; explicit pairing; phone companion | PASS |
| companion allowance (30 requests per client IP / 10 seconds, then 429 + positive `Retry-After`) | PASS |
| deliberate clipboard read/write; local persistence boundary; 32 KB Unicode rejection; expiry | PASS |
| no telemetry; no account; free two-device tier; native license verification; no dead checkout action | PASS |

The native allowance test observed 30 successful requests from one loopback client and request 31 as HTTP 429 with a positive `Retry-After` header. There is no sign-in flow, so the Entra tenant condition does not apply.

## Clean checkout gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 67 packages; 0 reported vulnerabilities |
| `npm test` | PASS — 3 Vitest, 5 release/provenance, 44 Playwright, and 8 Rust tests |
| `npm run check` | PASS — TypeScript and Rust no-default-features checks |
| `npm run build` | PASS — produced `dist/app/` and `dist/site/` |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` | PASS |

For the full-feature lint, this disposable container initially lacked the README-documented Tauri Linux GUI packages. After installing `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf rpm`, clippy passed unchanged. No product source was changed.

The production site build is well within static budgets: landing JavaScript is 4,234 bytes (1,630 bytes gzip), CSS is 9,447 bytes (2,742 bytes gzip), and the 1200 px hero WebP is 65,808 bytes.

## Product and deployment QA

- **Demo flow:** PASS at live 390 px. Sample data loaded; a realistic link handoff sent; 8,193 four-byte characters produced `Text must be 32 KB or less.`; reset removed the sent ticket. Demo state stayed in `sessionStorage` under `demo:clipboard-lan-bridge:tickets`; the real localStorage ticket key was absent.
- **Native core:** PASS through the shipped tests for pairing approval, direct send/receive, replay and expiry rejection, ciphertext/metadata tamper rejection, mobile crypto round trip, peer limits, and non-persistence of active tickets.
- **Accessibility:** PASS on desktop and 390 px. Live `/`, `/demo/`, `/privacy/`, `/terms/`, and 404 have specific titles, `lang=en`, one h1, main landmark, and no horizontal overflow. Axe Playwright found zero serious/critical WCAG 2 A/AA findings on desktop and mobile. Keyboard starts at the skip link and focus is visibly styled. Reduced-motion CSS disables transitions/animation.
- **Privacy/network:** PASS. Fresh live landing and demo flows made requests only to `https://clipboard-lan-bridge.sociobot.in`; there were no failed responses, console errors, page errors, analytics, trackers, GitHub API calls, CDN fonts, or external scripts.
- **Headers/cache:** PASS. Root response includes HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, camera/microphone/geolocation disabled, and CSP `default-src 'self'` with `connect-src 'self'` and `frame-ancestors 'none'`. HTML revalidates at 30 seconds; hashed JS/CSS are one-year immutable; `sw.js` is no-cache.
- **Links:** PASS. Public links returned 200, package navigation returned the expected GitHub 302, and `mailto:` links are explicit.
- **Desktop release:** PASS. GitHub release `v0.1.7` publishes AppImage, DEB, RPM, MSI, EXE, two DMGs, `SHA256SUMS`, and `latest.json`. A fresh RPM download SHA-256 was `0cb6265ccb6c20299f87afd0db7ae78a0fc689306fdc8ac183e59695760511f3`, exactly matching `SHA256SUMS`.

## Deployment identity

Candidate `099d751…` deliberately follows tagged desktop source `742a2aa…` by publishing the workflow-generated v0.1.7 manifest and evidence; product source is unchanged between those commits. The release `latest.json`, the candidate `site/release-manifest.json`, and the deployed release metadata name `742a2aaa0f145033c2cd8d9ee3266169074cde22`.

Fresh candidate builds were byte-identical to live root, demo, privacy, terms, landing JS/CSS, and demo JS/CSS. For example, both live and local root `index.html` SHA-256 are `b0a445750eaa1cc166ff3eea36da40e71ffb4606262a0d696ef05e0b8ba1c0de`.

## Defects

None found. The intentional absence of a checkout action remains documented in the product because its scoped checkout was previously unavailable; the shipped free local route is honest and complete, and the page makes no unavailable paid promise.
