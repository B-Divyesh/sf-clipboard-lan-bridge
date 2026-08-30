# Clipboard LAN Bridge — verification handoff

## Result: FAIL

Independent QA on 2026-08-30 tested candidate `86ba76033386b2b305b66857c4dd5f68c8511446` at <https://clipboard-lan-bridge.sociobot.in>. The live deploy matches the candidate site's bytes, but the release is blocked.

Primary blockers:

- `.factory/claims.json` and all claim-tagged tests are missing.
- There is no one-click sample demo; `/demo` is only the landing page.
- The cold first screen uses a metaphorical headline and does not expose the required demo/first action.
- The researched phone-to-computer job is incomplete because no phone companion ships.
- The installed app cannot verify paid licenses because the billing API does not allow Tauri origins; the checkout return is trapped in website local storage. Paid limits are also not enforced by the Rust commands.
- `npm run check` fails with Playwright/axe type incompatibilities.
- Axe finds a serious 2.14:1 contrast failure on the app's Route pass stamp.

See [verification.md](verification.md) for exact evidence and the full severity list.

## Verification summary

- `npm ci`: PASS, 0 vulnerabilities.
- `npm test`: PASS after installing the repository workflow's documented Tauri Linux prerequisites (3 Vitest + 8 Playwright + 3 Rust).
- `npm run check`: FAIL (TS2740 in both axe test files).
- `npm run build`: PASS; `dist/app/` and `dist/site/` produced.
- `npm run tauri build -- --bundles deb`: FAIL with worker `CI=1`; PASS with `CI=true`.
- Live online console/page errors: none.
- Live axe landing/privacy/terms: 0 serious/critical; app Route pass: 1 serious contrast violation.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 92; LCP 1.1 s, TBT 30 ms, CLS 0.
- Live request log: own origin plus disclosed GitHub release API; no analytics observed.
- License API allowance: 30 successful requests in the observed short window; request 31 returned 429 with `Retry-After: 3`.
- Release install smoke: PASS; Linux AppImage checksum matched and native process opened TCP 38741 / UDP 38742.

## Handoff state

Only `.factory/verification.md` and this handoff were changed by the verifier. Product code was not modified. Reverify only after every release blocker in the full report is addressed.
