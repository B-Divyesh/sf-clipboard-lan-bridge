# Adversarial first-read review 2

## Verdict: FAIL

- Product: Clipboard LAN Bridge
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Candidate: `e0eb2ed7c1c11c1b62b51ae9552e3c78f9089842`
- Reviewed: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-review-2`

The first screen is understandable and every declared claim command exits successfully. The product still fails because the demo reset is incomplete, the desktop-app sample experience required by the demo contract is absent, three earlier findings remain unfixed or only partly fixed, one earlier focus repair regressed on the primary demo path, and public copy contains unlisted or unclear claims.

## Findings

### Blocking

#### F-2-1 — Reset demo does not restore the sample form

- Exact location: live `/demo/`, **Reset demo**.
- Observed result: after changing the text to “Visitor draft” and the expiry to “2 minutes,” Reset restores the grocery arrival but leaves `#demo-text === "Visitor draft"` and `#demo-expiry === "120"`.
- Code evidence: `site/demo/main.ts` resets only the ticket array, renders it, and focuses the textarea. It does not restore the seeded rail-booking text, the 10-minute selection, the byte count, or validation state.
- Why this fails: Reset does not return the sandbox to its documented clean sample. The demo-sandbox contract makes a working Reset mandatory, and a weak demo is blocking.
- Concrete fix: make Reset restore every demo-controlled field and state value, then extend `@claim:sample-demo` to change text, expiry, error state, and arrivals before asserting the complete seed is restored.

#### F-2-2 — The desktop product has no sample path in the app and no screenshot walkthrough

- Exact locations: `src/` and `src-tauri/` contain no sample/demo first-run action; the landing page contains one illustrative poster and no screenshots of the installed app.
- Why this fails: this repository declares `artifact_class: desktop-app`. The desktop demo contract requires a first-run “Load sample…” path, sample data shipped with the app, and a captioned 3–5 frame walkthrough. The separate web simulation does not verify what the installed application looks like or how its actual pairing/send/receive flow behaves.
- Concrete fix: add a native **Load sample transfer** action that uses an isolated demo namespace, and add three to five captioned screenshots showing pairing, sending, receiving, and copying. Test reset and real-data separation in the packaged-app path.

#### F-1-7 — The researched one-time purchase is still unavailable

- Exact quotes: landing — “Purchases are currently unavailable.” README — “Checkout is disabled by default.”
- Code evidence: `site/main.ts` renders checkout only for a special build-time URL; the shipped build has no purchase action. `tests/paid-unlock.spec.ts` explicitly asserts that no checkout link exists.
- Why this remains blocking: `.factory/brief.json` specifies one-time monetization, while the live product advertises a $9 tier that a new customer cannot buy. The previous handoff also lists operator enablement as unfinished.
- Concrete fix: complete product-scoped Sociobot enrollment, enable only the documented scoped checkout, verify checkout/return/restore/revocation without exposing provider keys, and add the observable purchase path to the claim. If the tier is intentionally unavailable long-term, remove the offer and obtain a factory scope change.

#### F-1-8 — The code-signing claim remains stronger than its test

- Exact quotes: landing and README — “Packages are not code-signed.”
- Declared claim: “The download page warns that packages are not code-signed.”
- Test behavior: `@claim:unsigned-packages` checks that the warning text appears and that “community build” is absent. It never inspects the published MSI/EXE/DMG/AppImage signatures.
- Why this is only half-fixed: the prior finding required either artifact-level verification or narrower copy that only describes the warning. The public copy still makes the artifact-level statement, while the new claim and test prove only that the page displays it.
- Concrete fix: verify Authenticode, macOS signing/notarization, and applicable Linux signature metadata for the published files, or rewrite the copy to the exact tested statement: “Your operating system may show an unverified-publisher warning.”

#### F-1-13 — The primary demo route and Back still lose focus

- Exact live flow: `/` → **Try it with sample data** → `/demo/` leaves `document.activeElement === body`; browser Back to `/` also leaves focus on `body`.
- Code evidence: `site/a11y.ts` sets its focus marker only when the destination pathname changes. The primary action first navigates from `/` to `/?demo=1`, whose pathname is unchanged, and `site/main.ts` then calls `location.replace("/demo/")`.
- Why this remains blocking: the earlier repair test covers `/` → `/privacy/`, which passes, but misses the product's primary route. A keyboard or screen-reader visitor receives no route-change orientation in either direction.
- Concrete fix: link directly to `/demo/`, or treat the demo query as a route transition, then test forward and Back focus for the primary action at both viewports.

#### F-1-19 — The checksum status remains unexplained and unlinked

- Exact quote: landing download status — “Linux AppImage · checksum available in the release”.
- Why this is only half-fixed: the `SHA256SUMS` filename was removed, but “checksum” remains specialist language and there is no link or instruction showing a visitor what it verifies or how to use it. The concrete fix in review 1 required that explanation.
- Concrete fix: link a plain label such as **Verify this download** to short OS-specific checksum steps and the exact published checksum, or remove the status from the consumer path.

### High

#### F-2-3 — Cross-platform runtime support is an unlisted claim

- Exact quote: README — “The desktop app runs on Linux, macOS, and Windows.”
- Why this fails: `release-packages` proves that files are published and hashes one package per platform; it does not install or launch them. No `claims.json` entry states or tests runtime support on all three operating systems.
- Concrete fix: change the sentence to the tested “Packages are available for Linux, macOS, and Windows,” or add per-platform install/launch smoke tests and a matching runtime-support claim.

#### F-2-4 — The future payment and refund statement is unlisted

- Exact quote: landing — “When sales open, Sociobot will handle payment and refunds.”
- Why this fails: no claim entry tests this future payment/refund behavior, and checkout is currently absent. A visitor could rely on the named refund handler despite there being no observable purchase path or linked refund policy.
- Concrete fix: remove the sentence until checkout is enabled. When enabled, state the refund terms on `/terms/`, link them from pricing, and add a checkout/refund-routing claim with a sandboxed test.

#### F-2-5 — The paid tier does not say how many devices it adds

- Exact quotes: landing — “More devices and longer transfers” and “More paired devices”; README — “A $9 one-time license adds more paired devices and one-hour transfers.”
- Why this fails: “more” is not an exact entitlement. The native implementation removes the free peer limit entirely, but the customer-facing tier does not say whether the license adds one device, ten devices, or no limit.
- Concrete fix: publish and enforce a number. If the intended behavior is the current implementation, write “No paired-device limit” and add a claim test that verifies that stated limit.

### Medium

#### F-2-6 — The checkout build instruction is jargon-heavy

- Exact quote: README — “After the product operator confirms that the scoped Sociobot checkout works, build with `VITE_CHECKOUT_URL=https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` to show the purchase link.”
- Why this fails: “product operator” and “scoped Sociobot checkout” make the action harder to parse, and the condition precedes the instruction.
- Concrete rewrite: “To show the purchase link after this product's checkout works, set `VITE_CHECKOUT_URL=https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout`.”

#### F-2-7 — The privacy summary changes terms and uses network jargon

- Exact quotes: landing — “Relay”, “None · LAN only”; README — “This is a personal local-network tool”. Elsewhere the same concept is called “cloud relay” and “local network.”
- Why this fails: “LAN” is not expanded and “relay” alone does not name what is absent. The product should use one term for the same boundary.
- Concrete rewrite: use “Cloud service” / “None · local network only,” and “This is a personal tool for your local network, not a password manager.”

#### F-2-8 — “Visible on receiver” does not say what is visible

- Exact location: landing privacy signal board, value under “Approval” — “Visible on receiver”.
- Why this fails: out of context, the fragment neither names the approval action nor uses the established term “receiving device.”
- Concrete rewrite: “Required on the receiving device.”

#### F-2-9 — The 404 page opens with a transit pun

- Exact location: live unknown route, decorative label above the h1 — “Route not found”.
- Why this fails: this is brand-lore copy that duplicates the useful h1 “This page does not exist.” It uses “route” as a transit metaphor rather than naming the page state.
- Concrete fix: remove the label or replace it with “Page not found.”

#### F-2-10 — “Start for real” returns to the landing page instead of the real next step

- Exact location: demo banner — **Start for real**, `href="/"`.
- Why this fails: activating the control does discard demo tickets, but it merely returns to the top of the marketing page. It does not start, install, or open the real product, so the result does not match the label.
- Concrete fix: take the visitor to `/#download`, focus “Install the desktop app,” and state that a download is the next step. Retain the test that demo data is discarded.

## First-screen record, before scrolling

### 390 × 844

- What it does: sends a link, address, or note between the visitor's phone and computers on the same local network.
- For whom: someone using their own nearby devices.
- First action: **Try it with sample data**.
- Exact supporting copy: h1 “Send text to nearby devices”; sentence “Move one link, address, or note between your phone and computers on the same local network.”
- Result: PASS. All three answers and the sample action appear before scrolling.

### 1440 × 900

- What it does: sends text among nearby devices over the local network.
- For whom: a person moving short text among their own phone and computers.
- First action: **Try it with sample data**.
- Result: PASS. The headline, audience line, action, three facts, and explanatory illustration are visible before scrolling.

## Copy audit

Method: count whitespace-delimited words in each rendered copy unit. Sentences inside one paragraph are split. Headings, labels, controls, status text, and meaningful alt text are included because the plain-words rules apply to them. Shell commands are code, not sentences, so they are not counted separately. The dynamic Linux variant observed live is recorded.

### Live landing page

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 4 | Skip to main content | — |
| 2 | 3 | Clipboard LAN Bridge | — |
| 3 | 1 | Demo | — |
| 4 | 3 | How it works | — |
| 5 | 1 | Privacy | — |
| 6 | 1 | Download | — |
| 7 | 5 | For your own nearby devices | — |
| 8 | 5 | Send text to nearby devices | — |
| 9 | 16 | Move one link, address, or note between your phone and computers on the same local network. | — |
| 10 | 5 | Try it with sample data | — |
| 11 | 4 | Download for Linux ↓ | — |
| 12 | 3 | No cloud relay | — |
| 13 | 3 | No clipboard monitoring | — |
| 14 | 5 | Free for one paired device | — |
| 15 | 2 | Linux detected. | — |
| 16 | 4 | Packages are not code-signed. | F-1-8 |
| 17 | 11 | A phone, laptop, desktop, and tablet connected on one local network | — (image alt) |
| 18 | 9 | A phone and computers connected on one local network. | — |
| 19 | 4 | Text & links only | — |
| 20 | 3 | 32 KB maximum | — |
| 21 | 6 | Expires after 2 or 10 minutes | — |
| 22 | 3 | No clipboard history | — |
| 23 | 3 | How it works | — |
| 24 | 4 | Pair, send, and copy | — |
| 25 | 4 | Pair with a code | — |
| 26 | 6 | Both screens show the same code. | — |
| 27 | 8 | The receiving device must approve before pairing completes. | — |
| 28 | 3 | Choose what leaves | — |
| 29 | 11 | Paste or type text, pick a device, then choose Send text. | — |
| 30 | 5 | The clipboard is never monitored. | — |
| 31 | 4 | Copy before it expires | — |
| 32 | 8 | The encrypted text arrives over your local network. | — |
| 33 | 7 | Copy it before its time runs out. | — |
| 34 | 2 | Privacy limits | — |
| 35 | 5 | Only the text you choose | — |
| 36 | 10 | Clipboard LAN Bridge handles UTF-8 text and web links only. | — |
| 37 | 9 | It does not read clipboard changes, images, or files. | — |
| 38 | 1 | Transport | — |
| 39 | 2 | End-to-end encrypted | — |
| 40 | 1 | Relay | F-2-7 |
| 41 | 4 | None · LAN only | F-2-7 |
| 42 | 1 | Approval | — |
| 43 | 3 | Visible on receiver | F-2-8 |
| 44 | 1 | Telemetry | — |
| 45 | 1 | None | — |
| 46 | 2 | Free plan | — |
| 47 | 3 | One paired device. | — |
| 48 | 2 | No account. | — |
| 49 | 1 | Free | — |
| 50 | 3 | One paired device | — |
| 51 | 7 | Transfers expire after 2 or 10 minutes | — |
| 52 | 3 | End-to-end encrypted transfers | — |
| 53 | 3 | Download the app | — |
| 54 | 2 | One-time purchase | — |
| 55 | 5 | More devices and longer transfers | F-2-5 |
| 56 | 2 | $9 once | — |
| 57 | 3 | More paired devices | F-2-5 |
| 58 | 2 | One-hour transfers | — |
| 59 | 7 | Restore your license in the desktop app | — |
| 60 | 4 | Purchases are currently unavailable. | F-1-7 |
| 61 | 12 | Existing license holders can still restore a token in the desktop app. | — |
| 62 | 9 | When sales open, Sociobot will handle payment and refunds. | F-2-4 |
| 63 | 1 | Download | — |
| 64 | 4 | Install the desktop app | — |
| 65 | 9 | The site selects the current package for your computer. | — |
| 66 | 12 | Packages are not code-signed, so your operating system may ask for confirmation. | F-1-8 |
| 67 | 4 | Download v0.1.9 for Linux | — |
| 68 | 8 | Linux AppImage · checksum available in the release | F-1-19 |
| 69 | 2 | Terminal install | — |
| 70 | 3 | macOS / Linux | — |
| 71 | 3 | Copy install command | — |
| 72 | 2 | Windows PowerShell | — |
| 73 | 3 | Copy install command | — |
| 74 | 14 | To connect a phone, open the local phone address shown by the desktop app. | — |
| 75 | 9 | Keep the phone page open until the transfer arrives. | — |
| 76 | 6 | Send short text between nearby devices. | — |
| 77 | 4 | Built by Param Factory. | — |
| 78 | 1 | v0.1.9 | — |
| 79 | 1 | Privacy | — |
| 80 | 1 | Terms | — |
| 81 | 1 | Source | — |

No landing sentence exceeds 22 words. No banned marketing adjective appears. The flagged terms and claims are findings above. All visible landing buttons and action links name a result except the demo's separate **Start for real** control, F-2-10.

### README

| # | Words | Copy | Flag |
| ---: | ---: | --- | --- |
| 1 | 3 | Clipboard LAN Bridge | — |
| 2 | 10 | Send short text and links between your own nearby devices. | — |
| 3 | 9 | The desktop app runs on Linux, macOS, and Windows. | F-2-3 |
| 4 | 12 | Its phone page works in a phone browser on the same Wi-Fi. | — |
| 5 | 15 | Use it when you would otherwise message yourself a link, address, command, or short note. | — |
| 6 | 6 | How pairing and encryption protect transfers | — |
| 7 | 8 | Both devices display the same six-character pairing code. | — |
| 8 | 10 | The receiving device must approve it before transfers can start. | — |
| 9 | 5 | Transfers are encrypted after pairing. | — |
| 10 | 12 | The app rejects a transfer if its ID or expiry time changes. | — |
| 11 | 9 | It also rejects the same transfer a second time. | — |
| 12 | 10 | Only valid UTF-8 text up to 32 KB is accepted. | — |
| 13 | 8 | Free transfers expire after 2 or 10 minutes. | — |
| 14 | 11 | Clipboard reads and writes happen only after you choose a button. | — |
| 15 | 13 | The desktop app stores its identity, paired-device keys, and license on this computer. | — |
| 16 | 5 | Active transfers stay in memory. | — |
| 17 | 10 | Uninstall the app and remove its data to clear them. | — |
| 18 | 9 | Keep the phone page open until the transfer arrives. | — |
| 19 | 13 | The phone page accepts 30 requests from one network address every 10 seconds. | — |
| 20 | 14 | After that, it asks the browser to wait before trying again (`429` with `Retry-After`). | — |
| 21 | 10 | This is a personal local-network tool, not a password manager. | F-2-7 |
| 22 | 11 | Pair only on networks you trust and compare the displayed code. | — |
| 23 | 2 | Run locally | — |
| 24 | 14 | Requirements: Node.js 22+, Rust stable, and the Tauri 2 prerequisites for your operating system. | — |
| 25 | 8 | Run the product site with `npm run dev:site`. | — |
| 26 | 3 | Try the sample | — |
| 27 | 6 | Open `http://127.0.0.1:4173/?demo=1` after starting the site. | — |
| 28 | 14 | The sample saves data only in this browser tab under a separate `demo:` key. | — |
| 29 | 8 | It never writes sample transfers to app data. | — |
| 30 | 3 | Test and build | — |
| 31 | 17 | Run `npm test` to check unit logic, browser accessibility, product claims, screen sizes, and local transfer behavior. | — |
| 32 | 17 | Run `npm run build`; it creates the desktop app files in `dist/app/` and the website in `dist/site/`. | — |
| 33 | 9 | Build a local desktop package with the following command. | — |
| 34 | 8 | On Linux, install these desktop build packages first: | — |
| 35 | 3 | Install and release | — |
| 36 | 9 | GitHub Actions builds packages for macOS, Windows, and Linux. | — |
| 37 | 4 | Packages are not code-signed. | F-1-8 |
| 38 | 8 | On macOS, right-click the app and choose **Open**. | — |
| 39 | 6 | On Windows, confirm the publisher warning. | — |
| 40 | 6 | Windows PowerShell: `irm https://clipboard-lan-bridge.sociobot.in/install.ps1 \| iex` | — |
| 41 | 9 | Packages and SHA-256 checksums are in the latest release. | — |
| 42 | 7 | The site bundles the current release manifest. | — |
| 43 | 7 | Public pages contact only this product website. | — |
| 44 | 3 | License and policy | — |
| 45 | 10 | The free plan connects this computer and one paired device. | — |
| 46 | 11 | A $9 one-time license adds more paired devices and one-hour transfers. | F-2-5 |
| 47 | 4 | Purchases are currently unavailable. | F-1-7 |
| 48 | 14 | Existing license holders can paste a token under **Existing license** in the desktop app. | — |
| 49 | 5 | Checkout is disabled by default. | — |
| 50 | 19 | After the product operator confirms that the scoped Sociobot checkout works, build with `VITE_CHECKOUT_URL=https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout` to show the purchase link. | F-2-6 |
| 51 | 6 | Code is MIT licensed; see [LICENSE](LICENSE). | — |
| 52 | 11 | Product data practices are at `/privacy/`, and terms are at `/terms/`. | — |

No README sentence exceeds 22 whitespace-delimited words. No banned marketing adjective appears. F-2-6 is still flagged for unnecessary jargon and sentence order.

### Terminology check

| Concept | Terms observed | Result |
| --- | --- | --- |
| Payload/action | text; transfer | PASS: “text” is the payload and “transfer” is the event. |
| Connected endpoint | paired device; receiving device; receiver | FAIL: “receiver” is inconsistent and underspecified (F-2-8). |
| Network boundary | local network; LAN; local-network | FAIL: the abbreviation and wording change (F-2-7). |
| Demo storage | sample data; `demo:` key | PASS. |
| License | license; token | PASS: token is consistently the value used to restore a license. |

## Demo and sandbox

- PASS: the landing primary action enters `/demo/` in one click.
- PASS: the first demo screen shows a prefilled rail-booking handoff, two paired sample devices, and a grocery-list arrival.
- PASS: the persistent banner says “Demo — sample data, nothing is saved” and includes Reset and Start actions.
- PASS: sending writes only `sessionStorage["demo:clipboard-lan-bridge:tickets"]`. Real-data sentinels in local and session storage remained unchanged.
- PASS: **Start for real** removes the demo ticket key and does not copy sample records into the real namespace.
- PASS: every request observed across landing and demo stayed on `https://clipboard-lan-bridge.sociobot.in`; no analytics, font, script, API, or asset request left the origin.
- FAIL: Reset does not restore the compose text or expiry selection (F-2-1).
- FAIL: the desktop-app-specific first-run sample and screenshot walkthrough are absent (F-2-2).
- FAIL: Start for real does not take the visitor to an actual start step (F-2-10).

## Declared claims

All 21 entries in `.factory/claims.json` were run individually from a clean clone at `e0eb2ed7c1c11c1b62b51ae9552e3c78f9089842`. Every command exited 0.

| Claim | Command result | Observable evidence / exception |
| --- | --- | --- |
| `release-packages` | PASS | Public manifest and checksums loaded; one package per platform was downloaded and hashed. |
| `release-provenance` | PASS | Published manifest contained `v0.1.9` and a 40-character source commit. |
| `unsigned-packages` | PASS command; coverage finding | Two browser projects found the warning. The test does not verify package signatures (F-1-8). |
| `paid-unlock` | PASS command; product gap | Isolated project confirmed checkout is absent and token return is present; the advertised tier remains unavailable (F-1-7). |
| `platform-download` | PASS | Linux selection passed in desktop and mobile projects. |
| `public-page-network-boundary` | PASS | Root, demo, privacy, terms, and 404 stayed on local product origins in both projects. |
| `sample-demo` | PASS command; coverage finding | Send, ticket reset, exit, and ticket namespace isolation passed; form reset is not asserted (F-2-1). |
| `lan-only` | PASS | Native pair/send/receive lifecycle passed. |
| `end-to-end-encryption` | PASS | Valid decrypt and changed ID, expiry, and ciphertext rejection passed. |
| `explicit-pairing` | PASS | Transfer before approval was rejected, then approved transfer succeeded. |
| `phone-companion` | PASS | Loopback page/API pairing and encrypted exchange passed. |
| `companion-api-allowance` | PASS | Request 31 returned 429 with `Retry-After`. |
| `no-clipboard-monitoring` | PASS | Clipboard-read spy stayed at zero until the named action. |
| `explicit-clipboard-write` | PASS | Clipboard-write spy stayed at zero until Copy text. |
| `app-data-boundary` | PASS | Persisted config omitted inbox and sent transfers. |
| `text-32kb` | PASS | 32,768 bytes sent; 32,769 bytes and 8,193 four-byte characters were rejected in both projects. |
| `expiry` | PASS | Controlled time verified both 2- and 10-minute boundaries in both projects. |
| `no-telemetry` | PASS | Demo and app browser requests remained on the two local test origins. |
| `no-account` | PASS | Demo completed without sign-in UI. |
| `two-device-free-tier` | PASS | Native state enforced one free peer and enabled an additional peer plus one-hour expiry for a valid recorded license. |
| `native-license-verification` | PASS | Browser-written verdict was ignored and native invoke fixture enabled the license. |

Unlisted public claims remain:

- README cross-platform “runs” claim (F-2-3).
- Landing future payment/refund handler claim (F-2-4).
- Artifact-level unsigned-package claim, which is stronger than the listed warning claim (F-1-8).

## Earlier finding verification

Every finding in `.factory/review-1.md`, the repair assertions in `.factory/polish-1.md`, and the current `.factory/handoff.md` were checked against the live site and source.

| Earlier ID | Status in review 2 | Evidence |
| --- | --- | --- |
| F-1-1 | Fixed | Published-release test fetches `latest.json`, `SHA256SUMS`, and hashes one downloaded package per platform. |
| F-1-2 | Fixed | Companion test serves the bundled phone page, pairs through its API, and exchanges encrypted text both ways. |
| F-1-3 | Fixed | Lifecycle test rejects a transfer before approval. |
| F-1-4 | Fixed | Tagged browser test accepts exactly 32,768 bytes and rejects both over-limit cases. |
| F-1-5 | Fixed | Controlled-clock test verifies removal after both expiry choices. |
| F-1-6 | Fixed | “Signed release manifest” is absent from live copy and README. |
| F-1-7 | Unfixed — BLOCKING | $9 tier remains visible but purchases remain unavailable. |
| F-1-8 | Half-fixed — BLOCKING | A warning claim exists, but the stronger artifact claim is still untested. |
| F-1-9 | Fixed | Password-autofill claim is absent. |
| F-1-10 | Fixed | Detailed discovery-payload claim is absent. |
| F-1-11 | Fixed | Algorithm names are absent from public copy. |
| F-1-12 | Fixed | Copy now gives the actionable “Keep the phone page open” instruction without a browser-behavior claim. |
| F-1-13 | Partly fixed/regressed — BLOCKING | Privacy forward/Back focus works; primary demo forward/Back focus remains on `body`. |
| F-1-14 | Fixed | Operational copy uses transfer and paired device instead of ticket/route metaphors. |
| F-1-15 | Fixed | Copy says “Expires after 2 or 10 minutes.” |
| F-1-16 | Fixed | Vague safety wording was replaced by “End-to-end encrypted transfers.” |
| F-1-17 | Fixed | “Community build” is absent; the remaining signing-test problem is F-1-8. |
| F-1-18 | Fixed | Both controls visibly say “Copy install command” and have OS-specific accessible names. |
| F-1-19 | Half-fixed — BLOCKING | Filename jargon is gone, but checksum remains unexplained and unlinked. |
| F-1-20 | Fixed | README heading is “How pairing and encryption protect transfers.” |
| F-1-21 | Fixed | Pairing uses “six-character pairing code.” |
| F-1-22 | Fixed | README explains changed ID/expiry and duplicate rejection in observable terms. |
| F-1-23 | Fixed | README says what stays on this computer and how to clear it. |
| F-1-24 | Fixed | Request-limit copy begins with the browser-visible outcome; protocol detail is parenthetical. |
| F-1-25 | Fixed | Demo copy says browser tab and separate `demo:` key. |
| F-1-26 | Fixed | Test copy is phrased as the `npm test` instruction. |
| F-1-27 | Fixed | Build output is phrased as the `npm run build` instruction; the command produced both directories. |
| F-1-28 | Fixed | README names the Linux desktop build packages directly. |
| F-1-29 | Fixed | Installer-verification promise is absent from public copy. |
| F-1-30 | Fixed | Public copy says “contact only this product website.” |
| F-1-31 | Fixed | Factory deployment claim is absent from README. |
| F-1-32 | Fixed | `release-provenance` exists and its public-manifest test passes. |
| F-1-33 | Fixed | Generated-artwork slogan is absent from the live footer. |

## Structure, accessibility, and link checks

- PASS: `/`, `/demo/`, `/privacy/`, `/terms/`, and an unknown route have `lang=en`, one h1, one main landmark, route-specific titles, descriptions, canonical URLs, OG/Twitter metadata, SVG favicon, and 180 × 180 apple-touch icon.
- PASS: root title is “Clipboard LAN Bridge — send text to nearby devices” (50 characters). Secondary titles follow the route-name pattern.
- PASS: the social image is 1200 × 630 and derived from the product artwork.
- PASS: an unknown URL returns HTTP 404 with the designed page and a route home.
- PASS: `robots.txt` and `sitemap.xml` are present; the sitemap lists all public routes.
- PASS: headers include CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, Referrer-Policy, and Permissions-Policy.
- PASS: header/footer structure is consistent, including Privacy, Terms, factory attribution, and v0.1.9.
- PASS: a live crawl found no failed link among internal routes, the source repository, and the selected v0.1.9 AppImage; allowed `mailto:` links were not fetched.
- PASS: live Axe scans returned zero violations at 390 × 844 and 1440 × 900 on every public route. There was no horizontal overflow.
- PASS: successful pages emitted no console or page errors. Chromium logged only the expected failed-resource line for the deliberately requested 404 document.
- PASS: focus styling, 44 px targets, reduced-motion rules, and local/system fonts are present and covered locally.
- PASS: the clean build's landing JS is 1.93 KB gzip and demo JS is 1.21 KB gzip, below the 150 KB limit.
- PASS: the art-deco transit-poster palette, typography, line work, and original illustration are visually distinct from a generic SaaS template and match `.factory/design.md`.
- FAIL: primary demo navigation and Back focus (F-1-13).
- FAIL: the 404 decorative label uses a metaphor instead of a plain page-state label (F-2-9).

## Missed leverage

No AI feature is justified. The core job is a deliberate private text transfer; sending clipboard content to a model would add cost and weaken the local-only model. Cloud sync, file/image sync, and clipboard history conflict with the brief's stated non-goals.

The obvious missing product value is already in scope rather than an AI add-on: the advertised one-time purchase remains unavailable (F-1-7). The native app's missing sample path and the landing page's missing actual-app walkthrough are the other concrete leverage gap (F-2-2).

## Verification summary

- Clean clone: `/tmp/clb-review2-clean-Zu69xz`, HEAD `e0eb2ed7c1c11c1b62b51ae9552e3c78f9089842`.
- `npm ci`: PASS; 67 packages, 0 reported vulnerabilities.
- All 21 declared claim commands: PASS by exit status.
- `npm test`: PASS; 3 Vitest, 3 Node, 47 Playwright, and 8 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS; produced `dist/app/` and `dist/site/`.
- Live cold first-screen checks: PASS at 390 × 844 and 1440 × 900.
- Live demo storage and same-origin requests: PASS, except incomplete reset and misleading real-start destination.
- Live metadata, route, 404, link, layout, and Axe checks: PASS, except the primary demo focus regression and 404 label.
- No product code, deployment, infrastructure, DNS, billing, secrets, or resources were changed or accessed.

## What would make this perfect

Resolve every finding above: make demo reset complete; add the desktop-native sample and actual-app walkthrough; complete or remove the unavailable paid offer; make package-signing statements testable; repair focus for the primary demo route; explain checksum verification; list or remove the two unlisted claims; publish an exact paid device limit; and replace the remaining jargon, ambiguous control result, and 404 metaphor. Then rerun every claim and the full checklist from a clean clone. No AI, cloud sync, file transfer, clipboard history, or decorative feature should be added.
