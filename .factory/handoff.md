# Clipboard LAN Bridge — review 4 handoff

## Result: FAIL

Adversarial review 4 is recorded in [review-4.md](review-4.md). No product code, deployment, infrastructure, billing, DNS, or secrets were changed.

## What was done

- Opened the live site cold at 390 × 844 and 1440 × 900 before inspecting the repository.
- Audited every landing-page and README sentence, heading, term, and action.
- Exercised the one-click demo, reset, exit, realistic sample, and real/demo storage separation.
- Ran all 23 commands declared in `.factory/claims.json` from a fresh clone.
- Rechecked every finding from reviews 1–3 and every polish/handoff assertion against live behavior and source.
- Crawled public links and checked titles, metadata, 404 behavior, focus restoration, request boundaries, responsive layout, console output, security headers, and visual identity.
- Ran live Playwright Axe at mobile and desktop widths on root, demo, privacy, terms, and 404 routes.

## Verification

```sh
npm ci
npm test
npm run check
npm run build
```

Results from `/tmp/clb-review4-eUWGtt/repo` at candidate `3163060`:

- `npm test`: PASS — 3 Vitest, 3 Node, 52 Playwright, and 8 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS — produced `dist/app/` and `dist/site/`.
- All declared claim commands exited 0.
- Live Axe: zero violations on all checked routes at both widths.
- Worker `verify-url.sh`: PASS with one h1, `lang=en`, main, complete alt text, and no console errors.
- Link crawl: PASS; selected v0.1.11 AppImage and all public product routes/assets checked returned 200.

## Findings left

- **F-1-7 (blocking):** one-time monetization remains unavailable while `.factory/brief.json` still requires it. The scoped checkout returns HTTP 404. Enable and test the Sociobot checkout, or formally revise the brief to legacy-license recovery only.
- **F-4-1 (blocking):** README says public pages contact only the product site, but `/?license=...` automatically calls `api.sociobot.in`. The tagged boundary test misses this state and records only GitHub requests. Narrow and disclose the boundary, then test every request including license return.
- **F-4-2 (minor):** README's GitHub Actions builder statement has no matching claim entry. Delete it or add a tagged `release-automation` claim.

## Reproduce the privacy mismatch

Open `https://clipboard-lan-bridge.sociobot.in/?license=fixture-token` in a fresh browser context and record requests. The page requests:

```text
https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?license=fixture-token
```

The current `@claim:public-page-network-boundary` test does not visit this route state.
