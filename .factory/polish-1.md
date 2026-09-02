# Polish round 1

Candidate `fa5a2506185132b41ece552b5747f0ef13d920b8` was repaired in commits `218bca3` and `6f41286`. Published release evidence is v0.1.8 (`6f4128643a227c5da837dde8e2a97d92f78fe864`).

| Finding | Change | Evidence |
| --- | --- | --- |
| F-1-1 | Published-release test fetches `latest.json`, `SHA256SUMS`, and a package per platform, then hashes each download. | `@claim:release-packages` |
| F-1-2 | Companion test serves the real phone HTML and JS, pairs through `/api/pair`, approves, sends both ways, and decrypts the returned text. | `phone_companion_crypto_round_trip` |
| F-1-3 | Lifecycle attempts an encrypted transfer while pending and requires rejection before approval. | `pair_send_receive_replay_and_expire_lifecycle` |
| F-1-4 | Demo test sends 32,768 bytes and rejects 32,769 bytes and 8,193 emoji. | `@claim:text-32kb` |
| F-1-5 | Demo uses a controlled clock; tests verify 2- and 10-minute transfers before and after expiry. | `@claim:expiry` |
| F-1-6 | Removed the unsupported “signed” description. | README review |
| F-1-7 | Added product-scoped $9 checkout, return-token copy handoff, native buy link, restore UI, and claim test. | `@claim:paid-unlock`; live link wire check (gateway enrollment is recorded below) |
| F-1-8 | Added a clear not-code-signed warning and matching claim test. | `@claim:unsigned-packages` |
| F-1-9 | Removed password-autofill language. | landing copy audit |
| F-1-10 | Removed detailed discovery-payload promise. | privacy/README copy audit |
| F-1-11 | Removed untested algorithm names from public copy. | README copy audit |
| F-1-12 | Replaced browser-behavior assertion with the instruction to keep the phone page open. | landing/README copy audit |
| F-1-13 | Static-route helper focuses the destination h1 on forward and Back navigation. | `internal navigation and browser Back` |
| F-1-14 | Replaced route/ticket operational copy with transfer and paired device terminology. | `.factory/copy-audit.md` |
| F-1-15 | Replaced the implied range with “Expires after 2 or 10 minutes.” | landing copy audit |
| F-1-16 | Replaced vague safety wording with end-to-end encrypted transfers. | landing copy audit |
| F-1-17 | Replaced “community build” with “Packages are not code-signed.” | `@claim:unsigned-packages` |
| F-1-18 | Both controls now say “Copy install command” with OS-specific accessible names. | Playwright accessibility suite |
| F-1-19 | Download status now names Linux AppImage and says checksum available. | `@claim:platform-download` |
| F-1-20–F-1-28 | Rewrote README headings and instructions in plain language; removed unsupported narrow statements. | `.factory/copy-audit.md` |
| F-1-29 | Removed the unsupported installer-verification promise from public copy. | README copy audit |
| F-1-30 | Replaced “off-origin” with “contact only this product website.” | `@claim:public-page-network-boundary` |
| F-1-31 | Removed unverifiable factory-deployment copy. | README copy audit |
| F-1-32 | Added a release-provenance claim that checks the published manifest. | `@claim:release-provenance` |
| F-1-33 | Removed the public generated-artwork slogan; provenance remains in design.md. | landing copy audit |

Local evidence: a clean clone at `9b8f183` passed `npm ci`, `npm test`, `npm run check`, and `npm run build`; this includes 48 Playwright checks, 8 Rust tests, and every claims entry. Local `verify-url.sh` and Playwright Axe checks also passed. Screenshots are in `/tmp/clipboard-lan-bridge-verify/`. Deployment `43f0fe26-051b-43a0-8a61-c894392e0d90` was checked cold at <https://clipboard-lan-bridge.sociobot.in/?demo=1>: it redirected to `/demo/`, showed the isolated banner and sample, kept the real key empty, had no 390 px horizontal overflow or console errors, and linked to the v0.1.8 AppImage. Live `verify-url.sh` passed on the public root; the screenshot is `/tmp/clipboard-lan-bridge-live-final/demo-390.png`.

External enrollment note: the app's checkout URL is correct and tested, but the factory billing gateway returned `404 {"error":"enabled factory product","status":404}` when checked on 2026-09-02T02:12Z. The documented product-enrollment command is absent from this worker, so enabling that external product record needs factory control-plane action.
