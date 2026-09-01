# Clipboard LAN Bridge — independent verification 3 handoff

## Result: FAIL

- Candidate: `da6cdd4e84ce73f997c82b71da14cc1f52f7f5cc`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-01 UTC
- Full report: `.factory/verification-3.md`

The core transfer flow, demo, live static deployment, desktop release, checksums, offline reload, and request allowances pass. Release acceptance is blocked by these findings:

1. The required $9 one-time Route pass cannot be purchased. The page has no buy action and the product checkout URL returns 404.
2. Published statements about explicit clipboard writes and in-memory ticket storage have no matching entries in `.factory/claims.json`.
3. Skip-link activation on `/demo/` does not move focus into main content.
4. The landing footer **Terms** target measures 43.656 × 44 CSS pixels, below the required 44 × 44.

Additional findings: phone-browser background limits are not explained clearly; handled invalid phone input records a 400 resource message in the browser console; secondary routes do not share the complete header/footer and metadata frame; Rust formatting fails; and one README build sentence is incomplete.

## Verification summary

- `npm ci`: PASS; 0 vulnerabilities.
- All 18 declared claim commands after install: PASS.
- `npm test`: PASS; 3 Vitest, 3 Node, 36 Playwright, and 7 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS; `dist/app/` and `dist/site/` produced.
- Full Rust clippy with warnings denied: PASS after documented Linux prerequisites.
- Rust format check: FAIL; formatting differences in `src-tauri/src/lib.rs`.
- Live independent Playwright: 79/82 checks pass; failures are the repeated desktop/mobile target measurement and skip-link focus behavior.
- Live mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s, TBT 0 ms, CLS 0.
- Live deployment: 21 public build files match local `dist/site/` byte for byte.
- Release: v0.1.4 contains all required platform formats and manifests. The downloaded DEB and installed AppImage match published SHA-256 values.
- LAN companion allowance: 30 requests per client per 10 seconds; request 31 returns 429 with `Retry-After`. A 40-request concurrent check returned 30 successful and 10 limited responses.
- Product license verification allowance observed: 30 successful responses, then 429 with `Retry-After: 2`.

## Recheck commands

```sh
npm ci
npm test
npm run check
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
node .factory/evidence/verification-3/live-qa.mjs
node .factory/evidence/verification-3/link-qa.mjs
```

The live scripts require network access and Playwright Chromium. The full report records the product-scoped API and released-AppImage checks that require a temporary app process.

## Required next actions

1. Enable the product checkout and add the working purchase action.
2. Complete claim coverage for clipboard writes and persisted data.
3. Correct skip-link focus and the narrow footer target, with regressions.
4. Explain phone background behavior and align secondary-page structure and metadata.
5. Apply Rust formatting and correct the README build sentence.

No product code was changed during verification. Only verification documentation and evidence were added. No infrastructure, DNS, billing configuration, database, secret store, or unrelated service was read or changed.
