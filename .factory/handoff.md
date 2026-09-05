# Send text to nearby devices — repair 9 handoff

## Result: blocked by billing registration

The site, app, demo, release, and documented claims pass. Two review 4 findings are fixed. New one-time purchases still cannot start because the Sociobot billing engine has no enabled product for `clipboard-lan-bridge`.

The live checkout returned HTTP 404 with `enabled factory product` on 5 September 2026. The approved `fleet/new-paid-product.sh` helper is not present in this worker. No approved billing credentials are available. The repository correctly keeps the purchase action disabled and does not offer a fake checkout.

## Commits and deployment

- Static implementation: `85e17b7f753a076f6c508f06bf5a697b9052e16f`.
- Documentation and evidence: the commit containing this handoff.
- Published desktop release: `v0.1.11`, built from `a97c9fdb3fb3e58640a16c17228b2db0081056ea`.
- Static deployment: `2175ff9d-c69e-4973-91ed-488976d26e19`.
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>.

## Changes

- The README and privacy page now disclose the license-return request precisely.
- The network-boundary claim now covers a returned license token.
- Its browser test records every request and allows only the exact Sociobot verification request in that state.
- The returned token is still removed from the address bar after storage.
- The unlisted GitHub Actions sentence was removed from the README.
- The existing-license restore and native verification paths remain available.

## Review history disposition

- Review 4 F-4-1 is fixed. A cold live license return made one off-site request, only to the exact Sociobot verification endpoint. The token left the address bar.
- Review 4 F-4-2 is fixed. The unlisted implementation statement is gone.
- Review 1 F-1-7 remains open. The source-of-truth brief still requires a one-time purchase, while the checkout endpoint returns 404.
- All other findings from reviews 1–4 remain fixed. The 23 declared claim commands passed again from clean checkout `85e17b7`.
- Verification reports 1–5 were repaired in earlier candidates. Reports 6, 8, 9, and 10 passed. Verification 7 regressions remain fixed: there is no dead checkout action, `npm test` passes, and Rust formatting passes.

The detailed earlier finding map remains in `review-4.md`. The new request-boundary result is in `evidence/repair-9/live-qa.json`.

## Verification

From an isolated clone at `85e17b7`:

```sh
npm ci
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --no-default-features -- -D warnings
```

Results:

- All 23 commands in `.factory/claims.json` passed individually.
- `npm test` passed 3 Vitest, 3 Node, 52 Playwright, and 8 Rust tests.
- `npm run check`, `npm run build`, Rust formatting, and Clippy passed.
- The build produced `dist/app/` and `dist/site/`.
- Landing JavaScript is 2.05 KB gzip. Landing CSS is 2.96 KB gzip.

Live checks at phone and desktop widths passed the first-screen, demo, reset, storage-isolation, keyboard, focus, reduced-motion, offline, legal-route, link, and designed-404 paths. Axe found no serious or critical issue. The worker URL verifier reported no console errors.

Lighthouse on the live root scored 99 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 2,180 ms, CLS was 0.002, and total blocking time was 25 ms.

Every deployed file matched the local `dist/site` file by SHA-256. Evidence and screenshots are under `.factory/evidence/repair-9/`.

## Installed artifact check

The live installer downloaded the v0.1.11 Linux AppImage into a clean consumer directory. Its SHA-256 matched the published checksum. After installing the README prerequisites, the artifact started and served the phone companion with one h1. The companion allowed 30 requests, then returned 429 with `Retry-After: 10`.

## Needs operator action

Register and enable `clipboard-lan-bridge` in the Sociobot billing engine with the approved factory billing tool. Set the return URL to `https://clipboard-lan-bridge.sociobot.in/`. Then add the real $9 one-time buy link and verify a complete hosted checkout and license return. Signing certificates remain optional operator inputs; current packages clearly state that they are unsigned.

No shared database, unrelated service, staging slot, or secret was accessed. No DNS or billing-provider state was changed. Checks used only the product site, its public release, and the product's public Sociobot endpoints.
