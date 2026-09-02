# Adversarial first-read review 1

## Verdict: FAIL

- Product: Clipboard LAN Bridge
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Candidate: `fa5a2506185132b41ece552b5747f0ef13d920b8`
- Reviewed: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-review-1`

The first screen and demo are clear and usable, the live structure is complete, and all declared commands exit successfully. The product does not pass because five claim tests do not prove the full claims they are tagged to prove, several published statements have no matching claim entry, route changes lose keyboard focus, the researched one-time purchase path is still absent, and the copy contains prohibited metaphor, jargon, ambiguity, and non-result-naming controls.

## Findings

### Blocking

#### F-1-1 — The release-package claim test does not verify a published release

- Exact claim: `.factory/claims.json` — “Release automation publishes macOS, Windows, and Linux packages with SHA-256 checksums.”
- Exact test: `scripts/verify-release.test.mjs` searches workflow and installer source for platform names, `SHA256SUMS`, `latest.json`, release-action text, and `sha256`.
- Why this fails: source text can pass when a workflow has never run, an asset is missing, or a published checksum does not match its package. The test does not observe the promised publication result. A manual HEAD check found all seven v0.1.7 asset URLs currently return 200, but that is not the tagged regression test required by the claims contract.
- Concrete fix: make `@claim:release-packages` query the current release, require every declared platform/architecture asset plus `SHA256SUMS` and `latest.json`, download at least one package per platform runner, and compare its SHA-256 with both manifests.

#### F-1-2 — The phone-companion claim test never pairs through the companion page

- Exact claim: “A nearby phone can pair through the desktop app's local companion page and exchange encrypted text.”
- Exact test behavior: `phone_companion_crypto_round_trip` checks that bundled source contains “Connect this phone” and `/api/pair`, then calls crypto helpers directly.
- Why this fails: the test never loads the phone page, calls the pairing endpoint, approves the phone, sends through the companion API, receives the text, or copies it. A source-string check plus a crypto unit test does not prove the advertised phone workflow.
- Concrete fix: start the companion server on loopback, open its real page in a fresh 390 px browser context, pair and approve through the actual HTTP/native boundary, send in both directions, and assert the displayed plaintext and encrypted wire payload.

#### F-1-3 — The approval claim is not tested before approval

- Exact claim: “A receiving device must approve the matching pairing code before transfer.”
- Exact test behavior: `pair_send_receive_replay_and_expire_lifecycle` creates a pending pair, manually moves it into `peers`, accepts it, and only then sends.
- Why this fails: the test never attempts a transfer while pairing is pending. It proves the happy path after approval, not that approval is mandatory.
- Concrete fix: in the tagged lifecycle test, attempt the same transfer before approval and assert rejection and an empty inbox; then approve matching codes and assert success.

#### F-1-4 — The 32 KB claim tests rejection but not allowed input

- Exact claim: “Only UTF-8 text of 32 KB or less can be sent.”
- Exact tagged browser test: submits 8,193 four-byte characters and checks the over-limit error.
- Why this fails: no tagged test sends exactly 32,768 UTF-8 bytes or confirms that valid text below the limit completes a transfer. The word “less” is tested; “or equal” and “can be sent” are not.
- Concrete fix: add exact-boundary cases to `@claim:text-32kb`: 32,768 bytes must appear as a received transfer; 32,769 bytes and 8,193 four-byte characters must be rejected.

#### F-1-5 — The expiry claim tests a label, not expiry

- Exact claim: “Free transfers expire after 2 or 10 minutes.”
- Exact tagged browser test: selects two minutes, sends, and checks for “2m left.”
- Why this fails: the test never advances time or confirms removal/rejection after either expiry. A label can be correct while expired data remains usable.
- Concrete fix: use a controllable clock in the demo/native lifecycle, assert availability immediately before each 2- and 10-minute boundary, then assert removal and replay rejection immediately after it.

### High

#### F-1-6 — README calls an unsigned JSON file “signed”

- Exact quote: `README.md`, Install and release — “The site bundles the current signed release manifest.”
- Why this fails: `site/release-manifest.json` contains version, commit, URLs, and hashes but no signature or signature-verification material. The packages are also explicitly unsigned. “Signed” has a specific security meaning and is unsupported here.
- Concrete fix: write “The site bundles the current release manifest.” If a cryptographic signature is intended, add a signature, publish the verification key/process, and add a claim test that rejects a changed manifest.

#### F-1-7 — The brief’s one-time purchase remains unavailable

- Exact locations: `.factory/brief.json` says `"monetization": "one-time"`; the prior `.factory/handoff.md` calls the absent purchase a known gap; the live page offers only “Free”; the native app still exposes “Existing license,” paid peer limits, and a one-hour expiry.
- Why this fails: a user can see or paste a paid entitlement in the installed app but has no supported way to obtain it. This is unfinished product capability, not an optional enhancement.
- Concrete fix: enable only the product-scoped Sociobot checkout, publish the exact one-time price and unlocked limits, connect checkout return to the native restore flow, and add an isolated checkout-to-license claim test. If purchase remains unavailable, remove dormant paid/license UI and revise the brief through the factory rather than leaving an unreachable entitlement.

#### F-1-8 — The unsigned-package warning is an unlisted claim

- Exact quotes: landing — “Linux detected · unsigned community build” and “Packages are unsigned, so your operating system may ask for confirmation.” README — “All packages are unsigned.”
- Why this fails: visitors rely on this security warning, but no `claims.json` entry states or tests that packages are unsigned.
- Concrete fix: add an `unsigned-packages` claim whose platform-runner tests inspect the actual macOS and Windows artifacts, or replace it with a narrower, tested statement about the warning users will see.

#### F-1-9 — Password-autofill access is an unlisted privacy claim

- Exact quote: landing Privacy limits — “It does not read clipboard changes, images, files, or password autofill data.”
- Why this fails: `no-clipboard-monitoring` spies only on `navigator.clipboard.readText`. No claim entry or test covers password-autofill data.
- Concrete fix: remove “password autofill data,” or add a dedicated claim with a packaged-app test that records every credential/autofill API and form access during startup, pairing, send, receive, and copy.

#### F-1-10 — The discovery payload is an unlisted privacy claim

- Exact quote: README Safety model — “Discovery broadcasts a random device ID, chosen device name, public key, and local port.”
- Why this fails: no claim entry records this externally visible data boundary. The pairing lifecycle constructs a peer but does not capture and allowlist the actual UDP discovery payload.
- Concrete fix: add a discovery-payload claim and capture a real announcement in a loopback sandbox; assert the exact allowed fields and absence of clipboard text, transfer text, license data, and private keys.

#### F-1-11 — Exact cryptographic algorithm claims are unlisted

- Exact quotes: “Desktop peers use X25519 key agreement and XChaCha20-Poly1305 encryption.” and “The phone companion uses P-256 key agreement and AES-256-GCM encryption.”
- Why this fails: `end-to-end-encryption` promises encryption generally; it does not list these algorithm claims. Algorithm names are precise security claims that can drift independently of the broader behavior.
- Concrete fix: either move the names to tested claim entries with known-vector/implementation assertions, or replace both sentences with “Desktop and phone transfers are encrypted after pairing.”

#### F-1-12 — The phone-background statement is unlisted and unproved

- Exact quotes: landing — “Keep that page open: phone browsers may pause background polling.” README — “Phone browsers may pause background polling, so arrivals can wait until you return.”
- Why this fails: this is a useful limitation but no listed test or cited platform evidence supports it.
- Concrete fix: avoid the browser-behavior claim and give the actionable instruction: “Keep the phone page open until the transfer arrives.”

### Medium

#### F-1-13 — Internal navigation and Back leave focus on the page body

- Exact live behavior: after activating the landing-page Privacy link, `/privacy/` loads with `document.activeElement === document.body`; browser Back returns to `/` with focus still on `body`.
- Why this fails: the URL, title, and content change, but a keyboard or screen-reader user receives no focus cue for the new page. The site-structure contract requires focus on the new h1 for route changes and restoration on back/forward navigation.
- Concrete fix: mark each h1 focusable with `tabindex="-1"`, identify internal route navigation before unload, focus the destination h1 after load, and restore meaningful focus on `pageshow`/back-forward. Add a live-style navigation and Back regression test.

#### F-1-14 — Transit metaphors replace the product’s established terms

- Exact landing quotes: “A phone and computers connected by one local route,” “before a route exists,” “The encrypted ticket arrives,” “Free local route,” and “One paired route.” README also switches among “transfer,” “item,” and “ticket.”
- Why this fails: the art may use a transit visual, but the plain-words contract prohibits metaphor in operational copy and requires one term per concept. A first-time reader must infer that “route” means a paired device connection and “ticket” means transferred text.
- Concrete fix: use “transfer” for a text handoff and “paired device” for a connection. For example: “A phone and computers connected on one local network”; “The receiving device must approve before pairing completes”; “The encrypted text arrives over your local network”; “Free plan”; “One paired device.”

#### F-1-15 — “2–10 minute expiry” implies a continuous range

- Exact quote: landing promise strip — “2–10 minute expiry.”
- Why this fails: the product offers exactly 2 or 10 minutes, not every duration from 2 through 10. “Expiry” is also less direct than a verb.
- Concrete fix: “Expires after 2 or 10 minutes.”

#### F-1-16 — “Full encryption and safety” is vague and broader than the tests

- Exact quote: free-plan list — “Full encryption and safety.”
- Why this fails: “full” and “safety” do not name an observable result, and no claim defines complete safety.
- Concrete fix: “End-to-end encrypted transfers.”

#### F-1-17 — “Unsigned community build” is ambiguous jargon

- Exact quote: live platform note — “Linux detected · unsigned community build.”
- Why this fails: “community build” does not say who built it, and “unsigned” is not explained.
- Concrete fix: “Linux detected. This app is not code-signed.”

#### F-1-18 — The two “Copy” buttons do not name their result

- Exact location: Terminal install, macOS/Linux and Windows PowerShell controls, each labelled “Copy.”
- Why this fails: a button name must state the result; out of nearby visual context, a screen-reader list of controls gives no object.
- Concrete fix: label both controls “Copy install command,” with an accessible OS-specific name where needed.

#### F-1-19 — The download status is written for release engineers

- Exact quote: “APPIMAGE · checksum published in SHA256SUMS.”
- Why this fails: “APPIMAGE” and the checksum filename are unexplained jargon on a consumer download path.
- Concrete fix: “Linux AppImage · checksum available.” Link “checksum available” to a short verification explanation.

### Low

#### F-1-20 — “Safety model” is a jargon heading

- Exact location: README heading “Safety model.”
- Why this fails: it does not tell a non-security reader what the section contains.
- Concrete fix: “How pairing and encryption protect transfers.”

#### F-1-21 — “Fingerprint” conflicts with the landing page’s “code”

- Exact quote: README — “Both devices display the same six-character fingerprint.” Landing uses “code.”
- Why this fails: two terms describe the same pairing check, and “fingerprint” can suggest biometrics.
- Concrete fix: “Both devices display the same six-character pairing code.”

#### F-1-22 — The metadata sentences require specialist interpretation

- Exact quotes: “Transfer identity and expiry are authenticated.” and “Replayed or changed metadata is rejected.”
- Why this fails: “authenticated metadata” and “replayed” are security jargon without a user-visible consequence.
- Concrete fix: “The app rejects a transfer if its ID or expiry time changes. It also rejects the same transfer a second time.”

#### F-1-23 — “Operating system app-data directory” is unexplained

- Exact quote: README — “Identities, peer keys, and any license token stay in the operating system app-data directory.”
- Why this fails: the phrase is platform jargon and does not tell the reader how to clear it.
- Concrete fix: “The desktop app stores its identity, paired-device keys, and license on this computer. Uninstall the app and remove its data to clear them.” Add platform paths if users need them.

#### F-1-24 — The request-limit copy leads with protocol jargon

- Exact quotes: “The LAN companion allows 30 HTTP requests per client IP every 10 seconds.” and “It replies with HTTP 429 and a `Retry-After` header until that window resets.”
- Why this fails: the first sentence is not plain to a user; the second gives implementation codes before the usable outcome.
- Concrete fix: “The phone page accepts 30 requests from one network address every 10 seconds. After that, it asks the browser to wait before trying again (`429` with `Retry-After`).”

#### F-1-25 — The demo storage sentence is jargon-heavy

- Exact quote: README — “The sample uses a separate `demo:` session-storage namespace.”
- Why this fails: “namespace” is unnecessary and “session-storage” is not the platform API’s actual spelling.
- Concrete fix: “The sample saves data only in this browser tab under a separate `demo:` key.”

#### F-1-26 — The README’s test-scope claim is unlisted and jargon-heavy

- Exact quote: “The test command runs unit, Chromium accessibility, claim, responsive, and native protocol tests.”
- Why this fails: this is a factual quality claim without a `claims.json` entry, and “native protocol” is unexplained.
- Concrete fix: either add a repository-quality claim that executes `npm test`, or make it an instruction: “Run `npm test` to check unit logic, browser accessibility, product claims, screen sizes, and local transfer behavior.”

#### F-1-27 — The build-output claim is unlisted and uses “webview”

- Exact quote: “The build writes the desktop webview to `dist/app/` and the deployable site to `dist/site/`.”
- Why this fails: no claim entry tests both outputs, and “webview” is framework terminology.
- Concrete fix: “Run `npm run build`; it creates the desktop app files in `dist/app/` and the website in `dist/site/`.” Add an assertion for both directories to the build test.

#### F-1-28 — “GUI toolchain” does not name what Linux needs

- Exact quote: “On Linux, first install the same GUI toolchain used by the release workflow.”
- Why this fails: readers must inspect the following package list to discover what the phrase means.
- Concrete fix: “On Linux, install these desktop build packages first.”

#### F-1-29 — Installer verification is an unlisted claim

- Exact quote: “The installers read `latest.json` and verify SHA-256 before installing.”
- Why this fails: the `release-packages` sandbox mentions installer source, but its claim text does not state that the installers enforce checksums; its test only searches for the word `sha256`.
- Concrete fix: add an `installer-checksum` claim that runs each installer against a local fixture manifest, succeeds with a matching file, and refuses a changed file without installing it.

#### F-1-30 — “Off-origin” is internal web terminology

- Exact quote: “Public page loads make no off-origin requests.”
- Why this fails: the privacy result matters, but most readers do not know “origin.”
- Concrete fix: “Public pages contact only this product’s website.”

#### F-1-31 — The deployment statement is an unlisted implementation claim

- Exact quote: “Run `npm run build` to create the static site in `dist/site/`; the factory's static deployment publishes that directory from `main`.”
- Why this fails: the local command cannot prove what the factory deployment publishes, and no claim entry covers it.
- Concrete fix: split instruction from infrastructure fact: “Run `npm run build` to create `dist/site/`. The factory deploys `dist/site/` from the `main` branch.” Add a deployment-config check if the second sentence remains.

#### F-1-32 — Release provenance is not named in the claims list

- Exact quote: “The release `latest.json` records the tag and exact source commit alongside package checksums.”
- Why this fails: an untagged repository test checks provenance, but `claims.json` has no provenance claim. The contract requires the published claim and tagged test to correspond.
- Concrete fix: add a `release-provenance` entry using the existing provenance assertion, and validate the live `latest.json`, not only the bundled copy.

#### F-1-33 — “Original generated artwork” gives the visitor no usable information

- Exact quote: landing footer — “Original generated artwork.”
- Why this fails: it is a provenance slogan, not product guidance, and it is not a listed claim. The detailed provenance already belongs in `.factory/design.md`.
- Concrete fix: remove the sentence from the public footer; retain the existing design provenance document.

## First-screen record, before scrolling

### 390 × 844

- What it does: sends one link, address, or note between a phone and computers on the same local network.
- For whom: someone moving short text among their own nearby devices.
- First action: **Try it with sample data**.
- Result: PASS. The h1, audience/situation sentence, primary action, and three facts are visible before scrolling.

### 1440 × 900

- What it does: sends text to nearby devices.
- For whom: someone moving a link, address, or note between their phone and computers on one local network.
- First action: **Try it with sample data**.
- Result: PASS. The same information is visible before scrolling.

## Demo and sandbox

Result: PASS.

- The first click from `/` opens `/demo/` with the persistent “Demo — sample data, nothing is saved” banner.
- The first 390 px screen already shows two paired sample devices and a prefilled rail-booking handoff; a grocery-list arrival is present below.
- Sending creates a second record only in `sessionStorage["demo:clipboard-lan-bridge:tickets"]`.
- Non-demo sentinels in both `localStorage` and `sessionStorage` remained unchanged.
- **Reset demo** removed the sent record and restored the grocery sample.
- **Start for real** removed the demo key and returned to `/`.
- The complete observed live landing/demo request log used only `https://clipboard-lan-bridge.sociobot.in`.

## Declared claims

Every command from `.factory/claims.json` was run exactly after `npm ci`. “Command” records process success; “Coverage” records whether the tagged test proves the whole published claim.

| Claim | Command | Coverage |
| --- | --- | --- |
| `release-packages` | PASS | FAIL — F-1-1 |
| `platform-download` | PASS | PASS |
| `public-page-network-boundary` | PASS | PASS; live request log also same-origin |
| `sample-demo` | PASS | PASS; live storage check repeated |
| `lan-only` | PASS | PASS |
| `end-to-end-encryption` | PASS | PASS for the general claim; exact algorithm copy is unlisted in F-1-11 |
| `explicit-pairing` | PASS | FAIL — F-1-3 |
| `phone-companion` | PASS | FAIL — F-1-2 |
| `companion-api-allowance` | PASS | PASS |
| `no-clipboard-monitoring` | PASS | PASS; password-autofill wording remains unlisted in F-1-9 |
| `explicit-clipboard-write` | PASS | PASS |
| `app-data-boundary` | PASS | PASS |
| `text-32kb` | PASS | FAIL — F-1-4 |
| `expiry` | PASS | FAIL — F-1-5 |
| `no-telemetry` | PASS | PASS for the recorded flows |
| `no-account` | PASS | PASS |
| `two-device-free-tier` | PASS | PASS |
| `native-license-verification` | PASS | PASS for the recorded native fixture |
| `no-dead-checkout-action` | PASS | PASS; the missing intended purchase remains F-1-7 |

## Copy audit

Counts treat hyphenated terms, paths, URLs, code spans, and version numbers as one word. No landing or README unit exceeds 22 words, and no banned marketing adjective appears. Flags are the finding IDs above.

### Live landing page

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 3 | Clipboard LAN Bridge | — |
| 2 | 1 | Demo | — |
| 3 | 3 | How it works | — |
| 4 | 1 | Privacy | — |
| 5 | 1 | Download | — |
| 6 | 5 | For your own nearby devices | — |
| 7 | 5 | Send text to nearby devices | — |
| 8 | 16 | Move one link, address, or note between your phone and computers on the same local network. | — |
| 9 | 5 | Try it with sample data | — |
| 10 | 4 | Download for Linux ↓ | — |
| 11 | 3 | No cloud relay | — |
| 12 | 3 | No clipboard monitoring | — |
| 13 | 4 | Free for two devices | — |
| 14 | 6 | Linux detected · unsigned community build | F-1-8, F-1-17 |
| 15 | 9 | A phone and computers connected by one local route. | F-1-14 |
| 16 | 15 | Art-deco route map connecting a phone, laptop, desktop, and tablet with a traveling paper ticket | F-1-14 (alt text) |
| 17 | 4 | Text & links only | — |
| 18 | 3 | 32 KB maximum | — |
| 19 | 3 | 2–10 minute expiry | F-1-15 |
| 20 | 3 | No clipboard history | — |
| 21 | 3 | How it works | — |
| 22 | 4 | Pair, send, and copy | — |
| 23 | 4 | Pair with a code | — |
| 24 | 6 | Both screens show the same code. | — |
| 25 | 9 | The receiving device must approve before a route exists. | F-1-14 |
| 26 | 3 | Choose what leaves | — |
| 27 | 12 | Paste or type one text item, pick a device, then press Send. | F-1-14 |
| 28 | 5 | The clipboard is never monitored. | — |
| 29 | 3 | Copy before expiry | — |
| 30 | 7 | The encrypted ticket arrives over your LAN. | F-1-14 |
| 31 | 6 | Copy it before its expiry time. | — |
| 32 | 2 | Privacy limits | — |
| 33 | 5 | Only the text you choose | — |
| 34 | 10 | Clipboard LAN Bridge handles UTF-8 text and web links only. | — |
| 35 | 12 | It does not read clipboard changes, images, files, or password autofill data. | F-1-9 |
| 36 | 1 | Transport | — |
| 37 | 2 | End-to-end encrypted | — |
| 38 | 1 | Relay | — |
| 39 | 4 | None · LAN only | — |
| 40 | 1 | Approval | — |
| 41 | 3 | Visible on receiver | — |
| 42 | 1 | Telemetry | — |
| 43 | 1 | None | — |
| 44 | 3 | Free local route | F-1-14 |
| 45 | 2 | Two devices. | — |
| 46 | 2 | No account. | — |
| 47 | 1 | Free | — |
| 48 | 3 | One paired route | F-1-14 |
| 49 | 5 | 2 and 10 minute expiry | — |
| 50 | 4 | Full encryption and safety | F-1-16 |
| 51 | 3 | Download the app | — |
| 52 | 1 | Download | — |
| 53 | 4 | Install the desktop app | — |
| 54 | 9 | The site selects the current package for your computer. | — |
| 55 | 11 | Packages are unsigned, so your operating system may ask for confirmation. | F-1-8 |
| 56 | 4 | Download v0.1.7 for Linux | — |
| 57 | 6 | APPIMAGE · checksum published in SHA256SUMS | F-1-19 |
| 58 | 2 | Terminal install | — |
| 59 | 3 | macOS / Linux | — |
| 60 | 1 | Copy | F-1-18 |
| 61 | 2 | Windows PowerShell | — |
| 62 | 1 | Copy | F-1-18 |
| 63 | 14 | To connect a phone, open the local phone address shown by the desktop app. | — |
| 64 | 10 | Keep that page open: phone browsers may pause background polling. | F-1-12 |
| 65 | 6 | Send short text between nearby devices. | — |
| 66 | 3 | Original generated artwork. | F-1-33 |
| 67 | 5 | Built by Param Factory. v0.1.7 | — |
| 68 | 1 | Privacy | — |
| 69 | 1 | Terms | — |
| 70 | 1 | Source | — |

### README

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 3 | Clipboard LAN Bridge | — |
| 2 | 13 | Clipboard LAN Bridge sends short text and links between your own nearby devices. | — |
| 3 | 8 | The desktop app supports Linux, macOS, and Windows. | — |
| 4 | 13 | Its built-in phone companion works in a phone browser on the same Wi-Fi. | — |
| 5 | 9 | Transfers use explicit code approval and authenticated device-to-device encryption. | — |
| 6 | 12 | There is no cloud relay, account, clipboard watcher, file transfer, or telemetry. | — |
| 7 | 4 | Who it is for | — |
| 8 | 20 | It is for people who message themselves just to move a URL, address, command, or short note between nearby devices. | — |
| 9 | 2 | Safety model | F-1-20 |
| 10 | 14 | Discovery broadcasts a random device ID, chosen device name, public key, and local port. | F-1-10 |
| 11 | 7 | Both devices display the same six-character fingerprint. | F-1-21 |
| 12 | 5 | The receiving device must approve. | — |
| 13 | 9 | Desktop peers use X25519 key agreement and XChaCha20-Poly1305 encryption. | F-1-11 |
| 14 | 10 | The phone companion uses P-256 key agreement and AES-256-GCM encryption. | F-1-11 |
| 15 | 6 | Transfer identity and expiry are authenticated. | F-1-22 |
| 16 | 6 | Replayed or changed metadata is rejected. | F-1-22 |
| 17 | 10 | Only valid UTF-8 text up to 32 KB is accepted. | — |
| 18 | 8 | Free items expire after 2 or 10 minutes. | F-1-14 |
| 19 | 10 | Clipboard reads and writes happen only after a button press. | — |
| 20 | 14 | Identities, peer keys, and any license token stay in the operating system app-data directory. | F-1-23 |
| 21 | 5 | Active tickets stay in memory. | F-1-14 |
| 22 | 8 | Keep the phone companion page open while sending. | — |
| 23 | 13 | Phone browsers may pause background polling, so arrivals can wait until you return. | F-1-12 |
| 24 | 13 | The LAN companion allows 30 HTTP requests per client IP every 10 seconds. | F-1-24 |
| 25 | 13 | It replies with HTTP 429 and a `Retry-After` header until that window resets. | F-1-24 |
| 26 | 10 | This is a personal LAN tool, not a password manager. | — |
| 27 | 11 | Pair only on networks you trust and compare the displayed code. | — |
| 28 | 2 | Run locally | — |
| 29 | 14 | Requirements: Node.js 22+, Rust stable, and the Tauri 2 prerequisites for your operating system. | — (necessary dependency names) |
| 30 | 8 | Run the product site with `npm run dev:site`. | — |
| 31 | 3 | Try the sample | — |
| 32 | 6 | Open `http://127.0.0.1:4173/demo/` after starting the site. | — |
| 33 | 8 | The sample uses a separate `demo:` session-storage namespace. | F-1-25 |
| 34 | 8 | It never writes sample transfers to app data. | — |
| 35 | 3 | Test and build | — |
| 36 | 13 | The test command runs unit, Chromium accessibility, claim, responsive, and native protocol tests. | F-1-26 |
| 37 | 14 | The build writes the desktop webview to `dist/app/` and the deployable site to `dist/site/`. | F-1-27 |
| 38 | 9 | Build a local desktop package with the following command. | — |
| 39 | 13 | On Linux, first install the same GUI toolchain used by the release workflow. | F-1-28 |
| 40 | 3 | Install and release | — |
| 41 | 9 | GitHub Actions builds packages for macOS, Windows, and Linux. | — (`release-packages`) |
| 42 | 4 | All packages are unsigned. | F-1-8 |
| 43 | 8 | On macOS, right-click the app and choose Open. | — |
| 44 | 6 | On Windows, confirm the publisher warning. | — |
| 45 | 6 | Windows PowerShell: `irm https://clipboard-lan-bridge.sociobot.in/install.ps1 \| iex` | — |
| 46 | 9 | The installers read `latest.json` and verify SHA-256 before installing. | F-1-29 |
| 47 | 8 | The site bundles the current signed release manifest. | F-1-6 |
| 48 | 7 | Public page loads make no off-origin requests. | F-1-30 |
| 49 | 8 | Packages are also available from the latest release. | — |
| 50 | 1 | Deploy | — |
| 51 | 20 | Run `npm run build` to create the static site in `dist/site/`; the factory's static deployment publishes that directory from `main`. | F-1-31 |
| 52 | 19 | Push a version tag such as `v0.1.7` to build the unsigned macOS, Windows, and Linux installers in GitHub Actions. | F-1-8 |
| 53 | 13 | The release `latest.json` records the tag and exact source commit alongside package checksums. | F-1-32 |
| 54 | 11 | Copy that published file to `site/release-manifest.json` before the next site release. | — |
| 55 | 3 | License and policy | — |
| 56 | 6 | Code is MIT licensed; see LICENSE. | — (directly verifiable file) |
| 57 | 11 | Product data practices are at `/privacy/`, and terms are at `/terms/`. | — |
| 58 | 7 | The current release is free and local. | — |
| 59 | 8 | It connects this device and one paired device. | — |
| 60 | 7 | Transfers expire after two or ten minutes. | F-1-5 |

## Site structure, accessibility, and links

- PASS: titles follow the required root/secondary patterns and are under 60 characters.
- PASS: `/`, `/demo/`, `/privacy/`, `/terms/`, and the live unknown route have `lang=en`, one h1, one main landmark, descriptions, canonical URLs, OG/Twitter metadata, SVG favicon, and 180 px apple-touch icon.
- PASS: the social image is 1200 × 630.
- PASS: an unknown path returns the designed 404 body with HTTP 404 and a route home.
- PASS: shared header/footer, Privacy, Terms, version, source link, skip links, and visible focus styles are present.
- PASS: the live pages have no horizontal overflow at 390 × 844 or 1440 × 900.
- PASS: live Axe checks found zero serious or critical violations at both widths.
- PASS: all internal page links, the repository, and the live Linux package resolved; all seven release asset URLs returned 200 to HEAD checks. `mailto:` links were excluded as allowed.
- PASS: observed successful-page loads produced no console or page errors. Chromium reports the expected failed-resource console line for the deliberately requested HTTP 404 document.
- PASS: the art-deco local-route identity is visually distinct and matches `.factory/design.md`; it is not a generic SaaS template.
- FAIL: route-change and Back focus, F-1-13.

## History

- No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists in this repository or its reachable Git history.
- The prior handoff’s only known gap is the unavailable one-time purchase. It remains present in the live site and code as F-1-7.
- The handoff’s statements that tests/build pass, live pages share the site frame, demo state is isolated, and v0.1.7 packages are linked were independently reconfirmed.

## Missed leverage

- The brief does not justify an AI feature. Text transfer is deterministic, private, and useful without sending clipboard content to a model.
- Import/export and cloud sync would conflict with the stated non-goals of no clipboard history, file sync, or cloud relay.
- The concrete missing leverage is the already-designed paid entitlement: a supported one-time purchase and restore path for more peers/longer expiry, described in F-1-7.

## Verification summary

- `npm ci`: PASS; 67 packages, zero reported vulnerabilities.
- All 19 commands in `.factory/claims.json`: process PASS; coverage defects are F-1-1 through F-1-5.
- `npm test`: PASS; 3 Vitest, 5 Node release/provenance, 44 Playwright, and 8 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS; produced `dist/app/` and `dist/site/`.
- Live demo storage/reset/exit isolation: PASS.
- Live same-origin landing/demo request log: PASS.
- Live desktop/mobile structure and Axe smoke test: PASS except F-1-13.
- No product code, deployment, infrastructure, DNS, billing, secrets, or unrelated resources were changed or accessed.

## What would make this perfect

Resolve every finding above, not only the five blockers. In particular, make each tagged test prove its full observable claim, list or remove every narrower public claim, replace transit lore with one operational vocabulary, complete the product-scoped one-time purchase or remove dormant paid UI through an approved scope change, and make route/back focus deterministic. Then rerun the complete review from a clean clone and require zero findings. There is no additional AI, import/export, sync, or decorative feature that should be added.
