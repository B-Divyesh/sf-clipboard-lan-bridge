# Polish round 3

Candidate `5161f9f` was repaired in source commit `a97c9fd`; the v0.1.11 manifest was published in `7874ea5`. New-license sales remain operator-gated, so the product now exposes no purchase action and makes no claim that a new purchase works. Existing-license recovery remains available. Local and live screenshots are under `.factory/evidence/polish-3/`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the published manifest, checksum list, cross-platform package inventory, and downloaded package hashing test. | `@claim:release-packages`; v0.1.11 `latest.json` and `SHA256SUMS` |
| F-1-2 | Retained the real phone page/API pairing and encrypted two-way round trip. | `phone_companion_crypto_round_trip` |
| F-1-3 | Retained rejection before receiving-device approval. | `pair_send_receive_replay_and_expire_lifecycle` |
| F-1-4 | Retained acceptance at 32,768 bytes and rejection above it. | `@claim:text-32kb` |
| F-1-5 | Retained controlled-clock removal after both free expiry choices. | `@claim:expiry` |
| F-1-6 | Kept unsupported signed-manifest language absent. | README review; copy audit |
| F-1-7 | Removed the live checkout link, price, merchant/refund promise, and desktop Buy link. Added explicit unavailable states and kept returned/pasted-token recovery. Split this into observable purchase-safety and recovery claims. | `@claim:purchase-unavailable`; `@claim:license-recovery`; `@claim:native-license-verification`; `local-root/screenshot-{desktop,mobile}.png` |
| F-1-8 | Kept the narrow, testable unverified-publisher warning. | `@claim:unsigned-packages` |
| F-1-9 | Kept password-autofill language absent. | landing/privacy source review |
| F-1-10 | Kept untested discovery-payload detail absent. | README/privacy source review |
| F-1-11 | Kept exact algorithm names out of public copy. | README source review |
| F-1-12 | Kept the direct instruction to leave the phone page open. | landing and README copy audit |
| F-1-13 | Retained heading focus on internal navigation, demo entry, exit, and Back. | `internal navigation and browser Back`; `primary demo navigation and Back`; `@claim:sample-demo` |
| F-1-14 | Retained “transfer,” “paired device,” and “local network” as the operational terms. | `.factory/copy-audit.md` |
| F-1-15 | Retained the two exact expiry choices. | `@claim:expiry` |
| F-1-16 | Retained the bounded end-to-end encryption statement. | `@claim:end-to-end-encryption` |
| F-1-17 | Kept “community build” and artifact-signing claims absent. | `@claim:unsigned-packages` |
| F-1-18 | Retained OS-specific install-command accessible names. | `links and controls retain 44px targets` |
| F-1-19 | Retained plain checksum instructions behind **Verify this download**. | `@claim:platform-download`; `local-root/screenshot-desktop.png` |
| F-1-20 | Retained the plain README pairing/encryption heading. | `.factory/copy-audit.md` |
| F-1-21 | Retained “six-character pairing code” everywhere. | README source review |
| F-1-22 | Retained observable changed-ID, changed-expiry, and repeat-transfer wording. | `transfer_metadata_is_authenticated` |
| F-1-23 | Retained concrete local-storage and clearing guidance. | `app_data_persists_identity_peers_and_license_but_not_tickets` |
| F-1-24 | Retained user-first phone request-limit wording. | `phone_companion_enforces_a_documented_per_client_allowance` |
| F-1-25 | Retained the separate browser-session `demo:` key explanation. | `.factory/demo.md`; `@claim:sample-demo` |
| F-1-26 | Retained the direct `npm test` instruction. | clean-clone `npm test` |
| F-1-27 | Retained the directly verifiable build-output instruction. | clean-clone `npm run build`; `dist/app`, `dist/site` |
| F-1-28 | Retained the named Linux desktop build packages. | README source review |
| F-1-29 | Kept the unsupported installer-verification promise absent. | README source review |
| F-1-30 | Retained the visitor-language website request boundary. | `@claim:public-page-network-boundary` |
| F-1-31 | Kept unverifiable factory deployment language absent. | README source review |
| F-1-32 | Retained public tag/source-commit provenance verification. | `@claim:release-provenance` |
| F-1-33 | Kept the public generated-art slogan absent; provenance stays in the design record. | `.factory/design.md`; landing source review |
| F-2-1 | Retained complete reset of text, expiry, byte count, arrivals, and errors. | `@claim:sample-demo` |
| F-2-2 | Retained the isolated installed-app sample and three-frame walkthrough. | `@claim:desktop-sample`; `site/public/walkthrough/`; `local-root/screenshot-desktop.png` |
| F-2-3 | Retained the tested package-availability wording. | `@claim:release-packages`; README source review |
| F-2-4 | Removed merchant and refund copy because no new transaction is available. | `@claim:purchase-unavailable`; terms/README source review |
| F-2-5 | Existing-license benefits remain exact: no paired-device limit and one-hour transfers. No new-sale claim remains. | `@claim:two-device-free-tier` |
| F-2-6 | Kept checkout build-variable instructions absent. | README source review |
| F-2-7 | Retained “cloud service” and “local network” terminology. | `.factory/copy-audit.md`; `@claim:lan-only` |
| F-2-8 | Retained “Required on the receiving device.” | `@claim:explicit-pairing` |
| F-2-9 | Retained the plain **Page not found** state. | accessibility route test; live 404 check |
| F-2-10 | Retained **Download the desktop app**, install-step focus, and demo-data removal. | `@claim:sample-demo` |

## Local evidence

- `npm run check`: passed TypeScript plus Rust core checks.
- `npm test`: passed 3 Vitest, 3 release, 52 Playwright, and 8 Rust tests.
- `npm run build`: produced `dist/app/` and `dist/site/`; landing JS was 2.08 KB gzip and CSS was 2.96 KB gzip.
- Worker URL verification passed root, demo, privacy, and terms with one h1, `lang=en`, main landmark, complete alt text, and no console errors.
- Screenshots: `.factory/evidence/polish-3/local-root/screenshot-{desktop,mobile}.png`, `local-demo/`, `local-privacy/`, and `local-terms/`.

## Release and live evidence

- GitHub Actions run `33596532179` completed successfully. Release v0.1.11 contains seven desktop packages, `SHA256SUMS`, and `latest.json`; the manifest identifies source commit `a97c9fdb3fb3e58640a16c17228b2db0081056ea`.
- Azure Static Web Apps deployment `081119ea-e643-4cd9-b934-b2ec6f9aed88` completed successfully at <https://clipboard-lan-bridge.sociobot.in/>.
- Cold worker verification returned 200 for `/`, `/demo/`, `/privacy/`, and `/terms/`; the unknown route returned 404 with the designed title.
- The live 390 px flow had no overflow, no normal-route console/page errors, and zero serious/critical Axe findings on every public route. Root, demo, privacy, terms, 404, and the interactive demo screenshots are under `.factory/evidence/polish-3/live-*`.
- The live demo entered in one click, focused its h1, sent sample text, preserved a real-data sentinel, wrote only the `demo:` session key, reset every seed field, removed demo data on exit, focused the install heading, and reloaded offline from `clipboard-lan-bridge-v10`.
- The scoped checkout still returned 404, while the live product contained zero checkout links/forms and zero enabled Buy/Purchase controls. The selected Linux link resolved to the v0.1.11 AppImage with HTTP 200.
- Live Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100, LCP 2,135 ms, CLS 0.002, total blocking time 27 ms. Full JSON is `.factory/evidence/polish-3/lighthouse-live.json`; the cold audit summary is `live-check.json`.
