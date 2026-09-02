# Independent product verification 8

## Verdict: PASS

- Candidate commit: `a6dc612383ffa21954d22cb98e7f6450e3abc1e3`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-verify-8`

The candidate meets the researched brief for an intentional, local-only short-text handoff. No product code was changed during this verification.

## First read and demo

PASS. A cold desktop load has the title **Clipboard LAN Bridge — send text to nearby devices**, one `h1` (**Send text to nearby devices**), and plainly says: “Move one link, address, or note between your phone and computers on the same local network.” It identifies the audience (the visitor’s nearby devices) and presents **Try it with sample data** above the fold.

The one-click link redirects to `/demo/`, where the persistent **Demo — sample data, nothing is saved** banner, Reset demo, and Start for real are present. The realistic Kitchen phone / Studio laptop sample includes a grocery arrival. I completed a normal send, verified blank-input recovery (“Enter or paste something to send.”), rejected 32,769 bytes (“Text must be 32 KB or less.”), reset the demo, and confirmed that state is only in `sessionStorage["demo:clipboard-lan-bridge:tickets"]`; no real local-data key was written.

## Mandatory claims gate

PASS. `.factory/claims.json` exists with 21 unique claims. From this clean checkout after `npm ci`, every declared command was run. The release claims, each browser `--grep @claim:…` command, and each native `cargo test` command passed. `npm test` subsequently ran the whole suite and its Playwright result file records `{"status":"passed","failedTests":[]}`.

The passing claims cover published Linux/macOS/Windows packages and checksums, release provenance, unsigned-package wording, no enabled checkout, platform package selection, same-origin public pages, sample isolation, direct pairing/transfer/replay/expiry, authenticated encrypted metadata, explicit receiver approval, phone companion crypto, deliberate clipboard access, local persistence limits, 32 KB UTF-8 enforcement, no telemetry/account, free-tier limits, and native license verification.

The companion-server claim exercised the documented per-client allowance: 30 successful requests in 10 seconds; request 31 received `429 Too Many Requests` with a positive `Retry-After` header. The product has no sign-in flow, so the Entra tenant check is not applicable.

## Clean-checkout quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 67 packages audited; 0 vulnerabilities reported |
| `npm test` | PASS — 3 Vitest, 3 release, 47 Playwright, and 8 Rust tests |
| `npm run check` | PASS — TypeScript plus Rust no-default-feature check |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings` | PASS |
| `npm run build` | PASS — produced `dist/app/` and `dist/site/` |

The site’s landing JavaScript is 4,957 bytes raw / 1,951 bytes gzip, with the 1,340-byte accessibility module also loaded; demo JavaScript is 2,351 bytes raw / 1,229 bytes gzip. The landing CSS is 9,819 bytes raw. All are well below the static-product budgets. The mobile hero WebP is 32,472 bytes.

## Live deployment, privacy, accessibility, and PWA

PASS.

- The freshly built `dist/site/index.html`, `assets/main-Dq0vqsaq.js`, and `assets/main-BAWVSm5D.css` have the exact same SHA-256 values as production (`c402101e…51280c8`, `6c9a2e…227718`, and `471f98…9e594` respectively). Live asset references also exactly match the candidate build. The desktop package manifest records source `e15a40fe746244e962c4a0df9c713d1b915b4a5a`, an ancestor of this documentation/release-manifest candidate.
- Fresh desktop and 390 px mobile checks on `/`, `/demo/`, `/privacy/`, and `/terms/` found exactly one `h1`, a `main` landmark, correct route titles, no horizontal overflow, no page/console errors, and zero axe serious/critical findings. Keyboard Tab reaches the skip link and Enter moves focus to `main`; focus uses the product’s high-contrast brass/ink box-shadow. Reduced-motion contexts had no nonzero animation or transition duration.
- Complete public-route and demo request logs contained only `https://clipboard-lan-bridge.sociobot.in`; no analytics, CDN, GitHub API, billing, or other external request occurred. The normal page flow generated no console/page errors. The deliberate missing-page request naturally produces the browser’s failed-resource console entry for its own 404 and is not a normal-load error.
- Response headers include HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive Permissions-Policy, and CSP `default-src 'self'`, `connect-src 'self'`, and `frame-ancestors 'none'`. HTML revalidates in 30 seconds; hashed assets are one-year immutable; `sw.js` is `no-cache`.
- Live service-worker verification reached a controlled demo page with cache `clipboard-lan-bridge-v8`, created an obsolete cache, unregistered/reloaded, observed the obsolete cache removed and v8 controlling again, then reloaded the demo offline with its banner visible and no errors.
- Release `v0.1.9` contains AppImage, DEB, RPM, MSI, EXE, and both macOS DMGs, with `SHA256SUMS` and `latest.json`. The claim test downloaded/checksummed an asset from each desktop platform; an independent DEB spot check produced `6cf22d…71895`, matching the published sum.

## Defects by severity

None found.

## Notes / next steps

Checkout is intentionally unavailable and is truthfully described that way; the free product remains fully usable. Existing license tokens are restored in the installed app. The unsigned desktop-package warning is visible. Operator action is still needed only if paid checkout or code signing is later enabled.
