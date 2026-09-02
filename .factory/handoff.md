# Clipboard LAN Bridge — polish 1 handoff

## Result

Repaired every finding in `review-1.md` in commits `218bca3` and `6f41286`. The release tag `v0.1.8` builds the repaired desktop app through GitHub Actions. The site build remains static in `dist/site/`.

## What changed

- Added the direct `?demo=1` isolated sample path, persistent banner, reset, start-for-real cleanup, exact size and expiry tests.
- Replaced unproved source checks with observable published-release, loopback companion, pairing, expiry, and checkout-return tests.
- Added the $9 Sociobot one-time checkout, restore-token handoff, native purchase link, and free/paid limits.
- Rewrote landing, app, README, legal, metadata-facing, and download copy in one plain vocabulary.
- Fixed static-document route and Back focus, named install copy controls, and preserved the art-deco local-network identity.

See [polish-1.md](polish-1.md) for the finding-by-finding map.

## Verify

```sh
npm ci
npm test
npm run check
npm run build
```

Observed locally after a clean `npm ci`:

- `npm test`: pass — 3 Vitest, 3 published-release tests, 48 Playwright tests, and 8 Rust tests.
- `npm run check`: pass.
- `npm run build`: pass — `dist/app/` and `dist/site/` produced; initial site JS is 4.63 KB raw / 1.78 KB gzip and CSS is 9.82 KB raw / 2.81 KB gzip.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ /tmp/clipboard-lan-bridge-verify`: pass (title, lang, one h1, main, alt text, no browser console errors). Playwright Axe coverage has zero serious or critical violations on all public routes and desktop app views.

## Release and deployment

- GitHub Actions run: <https://github.com/B-Divyesh/sf-clipboard-lan-bridge/actions/runs/33581391078>
- Static deployment: push `main`; the factory deploys `dist/site/`.
- Public URL: <https://clipboard-lan-bridge.sociobot.in>

## Known gaps

None in product scope. The desktop packages are intentionally unsigned; the website explains the operating-system confirmation. The Axe CLI could not locate a system Chrome binary in this worker, so the equivalent maintained Playwright Axe integration is the recorded accessibility check.
