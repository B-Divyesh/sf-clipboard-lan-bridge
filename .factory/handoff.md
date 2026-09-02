# Clipboard LAN Bridge — review 2 handoff

## Result

Independent adversarial review 2 is **FAIL**. The complete report is in `.factory/review-2.md`.

No product code, deployment, infrastructure, DNS, billing, secrets, or external resources were changed or accessed. Only review documentation was changed.

## Main blockers

- Demo Reset restores arrivals but not edited text or expiry.
- The desktop app lacks the required native sample path and 3–5 frame actual-app walkthrough.
- Prior findings F-1-7, F-1-8, F-1-13, and F-1-19 remain unfixed or only partly fixed.
- The README's cross-platform runtime statement and the landing page's future payment/refund statement are not covered by claims.

## Verification performed

- Cold live inspection at 390 × 844 and 1440 × 900.
- Live demo send, reset, exit, storage isolation, and request-log checks.
- All 21 `.factory/claims.json` commands run individually from a clean clone at `e0eb2ed7c1c11c1b62b51ae9552e3c78f9089842`; all exited 0.
- `npm test`: PASS — 3 Vitest, 3 Node, 47 Playwright, and 8 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS — `dist/app/` and `dist/site/` produced.
- Live metadata, HTTP 404, internal/external link crawl, same-origin requests, desktop/mobile layout, and Axe checks completed.
- Every F-1-1 through F-1-33 item was reconciled against live behavior and source.

## Reproduce the key failures

1. Open <https://clipboard-lan-bridge.sociobot.in/demo/>.
2. Replace the sample text with `Visitor draft` and select `2 minutes`.
3. Choose **Reset demo**. The grocery sample returns, but the draft and two-minute selection remain.
4. Open <https://clipboard-lan-bridge.sociobot.in/>, activate **Try it with sample data**, and inspect `document.activeElement`; it is `body`, not the demo h1. Browser Back also leaves focus on `body`.
5. Inspect `tests/site.spec.ts`: `@claim:unsigned-packages` asserts warning text, not published artifact signatures.

## Files changed

- `.factory/review-2.md`
- `.factory/handoff.md`

## Next steps

Address every finding in `.factory/review-2.md`, preserve the same IDs for the four recurring findings, add the missing regression coverage, and rerun the complete review from a clean clone.
