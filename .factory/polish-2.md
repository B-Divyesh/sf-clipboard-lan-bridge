# Polish round 2

Candidate `e0eb2ed7c1c11c1b62b51ae9552e3c78f9089842` was repaired in `996e392` and `4fdad73`. Release and live evidence are appended after the tagged build and static deployment complete.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the published-release manifest, checksum, and cross-platform artifact hash test. | `@claim:release-packages` |
| F-1-2 | Kept the real companion-page pairing and encrypted round-trip test. | `phone_companion_crypto_round_trip` |
| F-1-3 | Kept the pending-pair rejection before approval assertion. | `pair_send_receive_replay_and_expire_lifecycle` |
| F-1-4 | Kept exact 32,768-byte acceptance and over-limit rejection. | `@claim:text-32kb` |
| F-1-5 | Kept controlled-clock removal checks for both free expiry choices. | `@claim:expiry` |
| F-1-6 | Kept unsupported manifest-signing language out of public copy. | README copy audit |
| F-1-7 | Enabled the scoped $9 Sociobot checkout link, returned-token storage, verification call, and desktop purchase link. | `@claim:paid-unlock` |
| F-1-8 | Replaced the signature assertion with the exact supported unverified-publisher warning. | `@claim:unsigned-packages` |
| F-1-9 | Kept password-autofill language removed. | landing and privacy copy audit |
| F-1-10 | Kept detailed discovery-payload language removed. | privacy copy audit |
| F-1-11 | Kept untested algorithm names out of public copy. | README copy audit |
| F-1-12 | Kept only the actionable instruction to keep the phone page open. | README and landing copy audit |
| F-1-13 | Focuses the demo h1 on entry and Back; the demo exit focuses the download heading. | `primary demo navigation and Back`; `@claim:sample-demo` |
| F-1-14 | Kept transfer, paired-device, and local-network wording throughout. | `.factory/copy-audit.md` |
| F-1-15 | Kept the two explicit expiry choices instead of a range. | `@claim:expiry` |
| F-1-16 | Kept the tested end-to-end encryption wording. | `@claim:end-to-end-encryption` |
| F-1-17 | Kept vague unsigned-build jargon removed. | `@claim:unsigned-packages` |
| F-1-18 | Kept explicit install-command control names. | Playwright target-size/accessibility suite |
| F-1-19 | Added a plain download-verification link and instructions beside the selected package. | `@claim:platform-download`; landing screenshot |
| F-1-20 | Kept the README heading in plain language. | `.factory/copy-audit.md` |
| F-1-21 | Kept one term: six-character pairing code. | README copy audit |
| F-1-22 | Kept changed-ID, changed-expiry, and replay behavior in observable words. | `transfer_metadata_is_authenticated` |
| F-1-23 | Kept local storage and clearing instructions concrete. | `app_data_persists_identity_peers_and_license_but_not_tickets` |
| F-1-24 | Kept the browser-visible request-limit explanation first. | `phone_companion_enforces_a_documented_per_client_allowance` |
| F-1-25 | Kept demo storage described as a browser session and separate `demo:` key. | `.factory/demo.md`; `@claim:sample-demo` |
| F-1-26 | Kept test instructions as commands, not a scope promise. | README copy audit |
| F-1-27 | Kept build output as a directly verifiable command result. | `npm run build` |
| F-1-28 | Kept the required Linux desktop packages named explicitly. | README copy audit |
| F-1-29 | Kept unsupported installer-verification language removed. | README copy audit |
| F-1-30 | Kept the public-page boundary in visitor language. | `@claim:public-page-network-boundary` |
| F-1-31 | Kept factory deployment implementation language removed. | README copy audit |
| F-1-32 | Kept the release-provenance claim and public manifest test. | `@claim:release-provenance` |
| F-1-33 | Kept the artwork slogan removed while preserving provenance in `design.md`. | landing copy audit |
| F-2-1 | Reset now restores the sample text, ten-minute selection, byte count, arrivals, and clears errors. | `@claim:sample-demo` |
| F-2-2 | Added native **Load sample transfer**, sample-only session storage, reset/exit controls, and three real app screenshots. | `@claim:desktop-sample`; `site/public/walkthrough/{pair,send,receive}.png` |
| F-2-3 | Replaced the unlisted “runs” sentence with package availability supported by the release-package claim. | `@claim:release-packages` |
| F-2-4 | Replaced future-tense payment copy with current merchant/refund wording and a listed claim. | `@claim:merchant-refund-terms` |
| F-2-5 | States the exact paid benefit: no paired-device limit plus one-hour transfers. | `@claim:two-device-free-tier` |
| F-2-6 | Removed build-variable checkout instructions; checkout is direct and scoped. | `@claim:paid-unlock` |
| F-2-7 | Uses “Cloud service: None · local network only” consistently. | landing copy audit; `@claim:lan-only` |
| F-2-8 | Replaces “Visible on receiver” with “Required on the receiving device.” | landing copy audit; `@claim:explicit-pairing` |
| F-2-9 | Replaced the 404 transit label with “Page not found.” | `landing and legal routes meet the accessibility baseline` |
| F-2-10 | Demo exit is now **Download the desktop app** and lands at the install step. | `@claim:sample-demo` |

Local screenshots and semantic/console checks are in `.factory/evidence/polish-2/local-root/`, `.factory/evidence/polish-2/local-demo/`, and `.factory/evidence/polish-2/local-privacy/`. Live deployment `f97e7e0d-c59b-4a6d-9c74-be90e8e786f8` was cold-checked at <https://clipboard-lan-bridge.sociobot.in/>, <https://clipboard-lan-bridge.sociobot.in/demo/>, <https://clipboard-lan-bridge.sociobot.in/privacy/>, and <https://clipboard-lan-bridge.sociobot.in/does-not-exist>. The interactive production screenshot is `.factory/evidence/polish-2/live-demo/interaction-desktop.png`; the 404 screenshot is `.factory/evidence/polish-2/live-404/screenshot-desktop.png`.
