# Clipboard LAN Bridge — polish round 2 handoff

## Result

Polish round 2 is repaired in commits `996e392dc4fcb2f9449525b6d5afb21cd90e5ee5` and `4fdad73ea02a25b07ac8de1777601cea9dd95234`. Release `v0.1.10` is published from the latter commit with macOS, Windows, and Linux packages, `SHA256SUMS`, and `latest.json`.

The static site is ready for deployment from `dist/site/`. The release workflow succeeded at <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/actions/runs/33591447659>.

## What changed

- The demo resets all sample form state, uses only its `demo:` session namespace, and exits to the real install step with restored keyboard focus.
- The installed desktop app has **Load sample transfer**, a persistent sample banner, reset/exit controls, and no writes to real app data while sample mode is active.
- The landing page includes a three-frame walkthrough captured from that actual app UI: `site/public/walkthrough/{pair,send,receive}.png`.
- Purchase copy now links directly to the product-scoped Sociobot checkout; returned licenses are stored under `sb_license:clipboard-lan-bridge`, verified at the scoped endpoint, and available to paste into the desktop app.
- Product copy now says local network, receiving device, exact free/paid limits, plain checksum instructions, and a plain 404 state. The artifact warning says only that an operating system may show an unverified-publisher warning.
- Every review finding is mapped in `.factory/polish-2.md`; claims are listed in `.factory/claims.json`.

## Verification

From a clean clone at `4fdad73ea02a25b07ac8de1777601cea9dd95234`:

- `npm ci`: PASS
- `npm run check`: PASS
- `npm run build`: PASS; creates `dist/app/` and `dist/site/`
- `npm test`: PASS — 3 unit tests, 3 release tests, 51 Playwright tests, and 8 Rust tests
- Every command in `.factory/claims.json` was run individually: PASS

Local static checks:

- `/opt/fleet/lib/verify-url.sh` passed for `/`, `/demo/`, and `/privacy/`: correct title/lang/one h1/main/alt text, no console errors. Evidence is in `.factory/evidence/polish-2/local-{root,demo,privacy}/`.
- The Playwright Axe integration found no serious or critical violations across landing, demo, privacy, terms, and 404 in both desktop and mobile projects.
- Production build budgets: site JS 5.31 KB gzip for the landing bundle; site CSS 10.38 KB gzip; desktop JS 15.79 KB gzip.

## Run and deploy

```sh
npm ci
npm run tauri dev
npm run dev:site
npm test
npm run check
npm run build
```

Deploy the static output with:

```sh
/opt/fleet/lib/deploy-static.sh clipboard-lan-bridge dist/site
```

## Operator note

The product UI and claim tests use the correct scoped checkout URL. A direct unauthenticated `HEAD` to that external gateway returned `404 {"error":"enabled factory product","status":404}` at 2026-09-02T04:35Z; this worker image has no documented `fleet/new-paid-product.sh` enrollment command or factory billing key. If the factory control plane has not already enabled the scoped product record, it must enable that record before a real buyer can complete checkout. No unrelated service, secret, database, or resource was accessed.
