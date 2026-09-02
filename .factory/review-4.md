# Adversarial first-read review 4

## Verdict: FAIL

- Product: Clipboard LAN Bridge
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>
- Candidate: `31630607ac49cfe5a801887a159fa8b7b5a2deb2`
- Reviewed: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-review-4`

The first screen, demo, routes, accessibility checks, release artifacts, and local quality gates pass. The product does not pass because the brief's one-time purchase remains unavailable and a listed privacy claim is false on the public license-return state. One README implementation claim is also absent from `claims.json`.

## Findings

### Blocking

#### F-1-7 — The source-of-truth one-time purchase remains unavailable

- Exact locations: `.factory/brief.json` says `"monetization": "one-time"`; the live pricing card says **“Restore paid access,” “Not for sale,”** and **“New licenses are not available.”** README repeats **“New licenses are not available.”**
- Live/code confirmation: the scoped Sociobot checkout still returns an error, while `tests/paid-unlock.spec.ts` and the public UI intentionally expose no purchase action. Existing-license recovery works, but a new visitor cannot obtain the entitlement whose benefits remain described.
- Why this remains blocking: this is the original F-1-7 product-scope gap. Removing the dead checkout made the page honest, but it did not implement the brief's one-time monetization or revise that source of truth. The prior handoff still lists billing enrollment as operator work.
- Concrete fix: register and enable this product in the Sociobot billing service, expose the product-scoped checkout only after it returns a usable checkout, and test checkout → returned token → native verification end to end. If sales are intentionally abandoned, formally revise the brief and keep only a clearly labeled legacy-license recovery area.

#### F-4-1 — The “only this product website” claim is false on the license-return route

- Exact quote: README and the listed `public-page-network-boundary` claim location — **“Public pages contact only this product website.”**
- Live evidence: a fresh visit to `https://clipboard-lan-bridge.sociobot.in/?license=review-test-token` immediately requested `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?license=review-test-token`. The page also saved the token under `sb_license:clipboard-lan-bridge` before removing it from the address bar.
- Code/test evidence: `site/main.ts` makes that fetch in `handleCheckoutReturn()`. The tagged test at `tests/site.spec.ts:50` visits only `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html`; it records only GitHub API requests rather than every off-origin request. The separate license-recovery test mocks the Sociobot request, proving that this public state intentionally crosses the stated boundary.
- Why this is blocking: a visitor could rely on this privacy promise when handling a license token. The declared command exits 0 because its sandbox omits the contradictory route and does not implement the claim's required all-request assertion.
- Concrete fix: either narrow the copy to ordinary landing/demo/legal loads and disclose the license verification exception, or change the return flow. Update `@claim:public-page-network-boundary` to record every request and include `/?license=fixture-license-token`; explicitly allow and assert only the documented Sociobot verification request for that state.

### Minor

#### F-4-2 — The GitHub Actions statement is an unlisted implementation claim

- Exact quote: README, Install and release — **“GitHub Actions builds packages for macOS, Windows, and Linux.”**
- Why this is a finding: `release-packages` proves that the current release has packages; it does not claim that GitHub Actions is the builder. The untagged workflow source test does not create the required claim-to-test mapping.
- Concrete fix: delete this redundant process sentence and retain **“Packages are available for Linux, macOS, and Windows.”** Alternatively, add a `release-automation` claim whose tagged test proves the workflow creates all named packages.

## First-screen record, before scrolling

| Viewport | What it does | Who it is for | First action | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Sends a link, address, or note between a phone and computers on one local network. | A person using their own nearby devices. | **Try it with sample data**. | PASS |
| 1440 × 900 | Sends short text to nearby devices over the local network. | A person moving text among their own phone and computers. | **Try it with sample data**. | PASS |

The exact first-screen support is **“Send text to nearby devices”** and **“Move one link, address, or note between your phone and computers on the same local network.”** The sample action and three short facts are visible at both sizes. There is no horizontal overflow or normal-load console error.

## Copy audit

Counts treat hyphenated terms, paths, URLs, code spans, and version numbers as one word. No sentence exceeds 22 words, no banned marketing adjective appears, and terminology remains consistent. Technical names such as UTF-8, SHA-256, Tauri, `429`, and `Retry-After` occur only where their exact format is useful.

### Landing-page sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 16 | Move one link, address, or note between your phone and computers on the same local network. | — |
| 2 | 2 | Linux detected. | — |
| 3 | 8 | Your operating system may show an unverified-publisher warning. | — |
| 4 | 9 | A phone and computers connected on one local network. | — |
| 5 | 6 | Both screens show the same code. | — |
| 6 | 8 | The receiving device must approve before pairing completes. | — |
| 7 | 11 | Paste or type text, pick a device, then choose Send text. | — |
| 8 | 5 | The clipboard is never monitored. | — |
| 9 | 8 | The encrypted text arrives over your local network. | — |
| 10 | 7 | Copy it before its time runs out. | — |
| 11 | 10 | Clipboard LAN Bridge handles UTF-8 text and web links only. | — |
| 12 | 9 | It does not read clipboard changes, images, or files. | — |
| 13 | 3 | One paired device. | — |
| 14 | 2 | No account. | — |
| 15 | 5 | New licenses are not available. | F-1-7 |
| 16 | 4 | Already have a token? | — |
| 17 | 6 | The desktop app can verify it. | — |
| 18 | 9 | The site selects the current package for your computer. | — |
| 19 | 8 | Your operating system may show an unverified-publisher warning. | — |
| 20 | 15 | Compare the file's SHA-256 value with the value in the release page before opening it. | — |
| 21 | 9 | On macOS or Linux, run `shasum -a 256 FILE`. | — |
| 22 | 7 | On Windows, run `Get-FileHash FILE -Algorithm SHA256`. | — |
| 23 | 14 | To connect a phone, open the local phone address shown by the desktop app. | — |
| 24 | 9 | Keep the phone page open until the transfer arrives. | — |
| 25 | 5 | 1. Pair a nearby device. | — |
| 26 | 6 | 2. Choose text and send it. | — |
| 27 | 5 | 3. Copy the received text. | — |
| 28 | 12 | Copy this license token, then paste it under Existing license in Devices. | — |
| 29 | 6 | Send short text between nearby devices. | — |
| 30 | 4 | Built by Param Factory. | — |

### README sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 10 | Send short text and links between your own nearby devices. | — |
| 2 | 8 | Packages are available for Linux, macOS, and Windows. | — |
| 3 | 12 | Its phone page works in a phone browser on the same Wi-Fi. | — |
| 4 | 15 | Use it when you would otherwise message yourself a link, address, command, or short note. | — |
| 5 | 8 | Both devices display the same six-character pairing code. | — |
| 6 | 10 | The receiving device must approve it before transfers can start. | — |
| 7 | 5 | Transfers are encrypted after pairing. | — |
| 8 | 12 | The app rejects a transfer if its ID or expiry time changes. | — |
| 9 | 9 | It also rejects the same transfer a second time. | — |
| 10 | 10 | Only valid UTF-8 text up to 32 KB is accepted. | — |
| 11 | 8 | Free transfers expire after 2 or 10 minutes. | — |
| 12 | 11 | Clipboard reads and writes happen only after you choose a button. | — |
| 13 | 13 | The desktop app stores its identity, paired-device keys, and license on this computer. | — |
| 14 | 5 | Active transfers stay in memory. | — |
| 15 | 10 | Uninstall the app and remove its data to clear them. | — |
| 16 | 9 | Keep the phone page open until the transfer arrives. | — |
| 17 | 13 | The phone page accepts 30 requests from one network address every 10 seconds. | — |
| 18 | 14 | After that, it asks the browser to wait before trying again (`429` with `Retry-After`). | — |
| 19 | 13 | This is a personal tool for your local network, not a password manager. | — |
| 20 | 11 | Pair only on networks you trust and compare the displayed code. | — |
| 21 | 14 | Requirements: Node.js 22+, Rust stable, and the Tauri 2 prerequisites for your operating system. | — |
| 22 | 8 | Run the product site with `npm run dev:site`. | — |
| 23 | 6 | Open `http://127.0.0.1:4173/?demo=1` after starting the site. | — |
| 24 | 14 | The sample saves data only in this browser tab under a separate `demo:` key. | — |
| 25 | 8 | It never writes sample transfers to app data. | — |
| 26 | 8 | In the installed app, choose **Load sample transfer**. | — |
| 27 | 14 | The sample uses a separate `demo:` browser-session key and does not write app data. | — |
| 28 | 17 | Run `npm test` to check unit logic, browser accessibility, product claims, screen sizes, and local transfer behavior. | — |
| 29 | 17 | Run `npm run build`; it creates the desktop app files in `dist/app/` and the website in `dist/site/`. | — |
| 30 | 9 | Build a local desktop package with the following command. | — |
| 31 | 8 | On Linux, install these desktop build packages first. | — |
| 32 | 9 | GitHub Actions builds packages for macOS, Windows, and Linux. | F-4-2 |
| 33 | 8 | Your operating system may show an unverified-publisher warning. | — |
| 34 | 8 | On macOS, right-click the app and choose **Open**. | — |
| 35 | 6 | On Windows, confirm the publisher warning. | — |
| 36 | 9 | Packages and SHA-256 checksums are in the latest release. | — |
| 37 | 7 | The site bundles the current release manifest. | — |
| 38 | 7 | Public pages contact only this product website. | F-4-1 |
| 39 | 10 | The free plan connects this computer and one paired device. | — |
| 40 | 10 | Existing licenses remove the paired-device limit and enable one-hour transfers. | — |
| 41 | 5 | New licenses are not available. | F-1-7 |
| 42 | 14 | Existing license holders can paste a token under **Existing license** in the desktop app. | — |
| 43 | 6 | License terms are available at `/terms/`. | — |
| 44 | 6 | Code is MIT licensed; see LICENSE. | — |
| 45 | 11 | Product data practices are at `/privacy/`, and terms are at `/terms/`. | — |

Headings are meaningful out of context: **How it works**, **Privacy limits**, **Free plan**, **Existing licenses**, **Download**, and **Desktop walkthrough** name their sections. Actions name results, including **Try it with sample data**, **Download the app**, **Download to restore a license**, **Verify this download**, and **Copy install command**. No metaphor heading, vague slogan, inconsistent operational term, or non-result-naming button was found.

## Demo and sandbox

Result: PASS.

- The first landing click opens `/demo/`. At 390 px the first screen shows the persistent **“Demo — sample data, nothing is saved”** banner, two paired sample devices, and realistic rail-booking text already in the product.
- A grocery-list arrival, Studio laptop sender, Kitchen phone destination, two expiry choices, byte counter, validation, and copy action make the sample operational rather than decorative.
- **Reset demo** restores the rail-booking text, ten-minute expiry, empty error, byte count, and grocery arrival.
- The web demo writes only `sessionStorage["demo:clipboard-lan-bridge:tickets"]`. Test sentinels in real local/session storage remained unchanged.
- **Download the desktop app** removes the demo ticket key and moves to the install section. The installed app separately provides **Load sample transfer**, **Reset sample**, and **Start for real** under `demo:clipboard-lan-bridge:desktop-sample`.
- The ordinary landing/demo flow made only same-origin requests. The license-return exception is F-4-1.

## Declared claims

All 23 listed commands were run from a fresh clone at `/tmp/clb-review4-eUWGtt/repo` after `npm ci`. Every command exited 0. F-4-1 is an observable coverage failure despite the command's exit status.

| Claim | Result | Evidence |
| --- | --- | --- |
| `release-packages` | PASS | Public v0.1.11 package inventory and SHA-256 checks passed. |
| `release-provenance` | PASS | Published tag and 40-character source commit passed. |
| `unsigned-packages` | PASS | Desktop and mobile pages show the bounded warning. |
| `purchase-unavailable` | PASS command; scope gap | No enabled checkout exists; the unresolved brief gap is F-1-7. |
| `license-recovery` | PASS | Recorded return saves the token, cleans the URL, and receives a fixture verdict. |
| `platform-download` | PASS | Fresh Linux contexts select the AppImage. |
| `public-page-network-boundary` | PASS command; FAIL coverage | The tagged test omits the license-return request; live contradiction is F-4-1. |
| `sample-demo` | PASS | Seed, send, validation, full reset, exit, and storage separation passed. |
| `desktop-sample` | PASS | Installed-app sample uses and clears only its demo session key. |
| `lan-only` | PASS | Native direct pair/send/receive lifecycle passed. |
| `end-to-end-encryption` | PASS | Changed ciphertext, transfer ID, and expiry are rejected. |
| `explicit-pairing` | PASS | Pending transfer is rejected before approval; approved transfer succeeds. |
| `phone-companion` | PASS | Loopback companion pairing and encrypted two-way text exchange passed. |
| `companion-api-allowance` | PASS | Request 31 returns `429` with `Retry-After`. |
| `no-clipboard-monitoring` | PASS | Clipboard read occurs only after the named action. |
| `explicit-clipboard-write` | PASS | Clipboard write occurs only after **Copy text**. |
| `app-data-boundary` | PASS | Identity, peers, and license persist; active tickets do not. |
| `text-32kb` | PASS | 32,768 bytes pass; 32,769 bytes and 8,193 four-byte characters fail. |
| `expiry` | PASS | Controlled time verifies both two- and ten-minute removal boundaries. |
| `no-telemetry` | PASS | Recorded demo/app flow stays on its two local product origins. |
| `no-account` | PASS | Demo send completes without sign-in fields. |
| `two-device-free-tier` | PASS | Native state enforces free and recorded-license limits. |
| `native-license-verification` | PASS | Browser-written verdict is ignored; recorded native response controls access. |

Unlisted claim: F-4-2. No other landing/README claim lacks a matching entry. No claim command was skipped.

## Earlier finding verification

Every finding in reviews 1–3, every polish record, and the current handoff was checked against live behavior and source.

| Earlier ID | Status now | Confirmation |
| --- | --- | --- |
| F-1-1 | Fixed | Release test fetches and hashes current cross-platform packages. |
| F-1-2 | Fixed | Companion page/API round trip uses the real bundled page. |
| F-1-3 | Fixed | Native lifecycle rejects transfer before approval. |
| F-1-4 | Fixed | Exact 32 KB boundary and both over-limit cases pass. |
| F-1-5 | Fixed | Both expiry choices are removed after controlled time. |
| F-1-6 | Fixed | “Signed manifest” wording is absent. |
| F-1-7 | Unfixed — BLOCKING | Checkout is now honestly absent, but one-time monetization remains unimplemented and the brief is unchanged. |
| F-1-8 | Fixed | Copy states only the tested unverified-publisher warning. |
| F-1-9 | Fixed | Password-autofill claim is absent. |
| F-1-10 | Fixed | Detailed discovery-payload claim is absent. |
| F-1-11 | Fixed | Exact algorithm names are absent from public copy. |
| F-1-12 | Fixed | Copy gives only the actionable phone-page instruction. |
| F-1-13 | Fixed | Demo entry and browser Back focus the destination h1 at both widths. |
| F-1-14 | Fixed | Operational copy consistently uses transfer and paired device. |
| F-1-15 | Fixed | Copy gives the exact two expiry choices. |
| F-1-16 | Fixed | Vague safety copy is replaced by bounded encryption language. |
| F-1-17 | Fixed | “Community build” wording is absent. |
| F-1-18 | Fixed | Install copy controls name their result and operating system. |
| F-1-19 | Fixed | **Verify this download** opens concrete checksum instructions. |
| F-1-20 | Fixed | README heading names pairing and encryption. |
| F-1-21 | Fixed | Pairing consistently uses “six-character pairing code.” |
| F-1-22 | Fixed | Changed ID/expiry and repeat rejection use observable wording. |
| F-1-23 | Fixed | README identifies local stored data and how to clear it. |
| F-1-24 | Fixed | Request-limit copy leads with the browser-visible result. |
| F-1-25 | Fixed | Demo storage is described as a browser-session `demo:` key. |
| F-1-26 | Fixed | README gives the direct `npm test` instruction; the command passed. |
| F-1-27 | Fixed | README gives the build instruction; both output directories were produced. |
| F-1-28 | Fixed | Linux prerequisites name the required packages. |
| F-1-29 | Fixed | Unsupported installer-verification promise is absent. |
| F-1-30 | Fixed wording | “Off-origin” jargon is absent. The newly discovered behavior mismatch is F-4-1. |
| F-1-31 | Fixed | Unverifiable factory deployment copy is absent. |
| F-1-32 | Fixed | Release provenance is listed and passes against the public manifest. |
| F-1-33 | Fixed | Public generated-art slogan is absent; provenance remains in design.md. |
| F-2-1 | Fixed | Reset restores every seeded field and error state. |
| F-2-2 | Fixed | Native sample and three-frame installed-app walkthrough are present. |
| F-2-3 | Fixed | README says packages are available rather than claiming runtime launch. |
| F-2-4 | Fixed | Future merchant/refund promise is absent. |
| F-2-5 | Fixed | Existing-license benefits state no paired-device limit and one-hour transfers. |
| F-2-6 | Fixed | Obsolete checkout build-variable instruction is absent. |
| F-2-7 | Fixed | Copy consistently uses cloud service and local network. |
| F-2-8 | Fixed | Approval is required on the receiving device. |
| F-2-9 | Fixed | The 404 label says **Page not found**. |
| F-2-10 | Fixed | Demo exit names the download result, clears demo data, and focuses install. |

## Structure, accessibility, and links

- PASS: `/`, `/demo/`, `/privacy/`, `/terms/`, and an unknown route have route-specific titles, `lang=en`, exactly one h1, a main landmark, descriptions, canonical URLs, Open Graph/Twitter fields, favicon, and apple-touch icon.
- PASS: the unknown route returns HTTP 404 with the designed page, shared header/footer, and a route home.
- PASS: direct routes, demo navigation, browser Back, and install-section exit restore heading focus. Skip links and visible focus are present.
- PASS: live Playwright Axe found zero violations at 390 × 844 and 1440 × 900 on all five routes. No route overflowed horizontally.
- PASS: the worker `verify-url.sh` reported one h1, `lang=en`, main, complete image alt text, and no console errors.
- PASS: every crawled page, source link, installer, crawler file, and selected v0.1.11 AppImage returned 200. In-page fragment targets exist; allowed `mailto:` links were not fetched.
- PASS: security headers include response-header CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, `no-referrer`, and Permissions-Policy.
- PASS: the art-deco transit-poster palette, ticket geometry, route lines, paper texture, and original illustration match `.factory/design.md` and are not a generic SaaS template.
- PASS: reduced-motion rules, 44 px targets, self-hosted/system fonts, and small bundles are present. Landing JavaScript is 5.22 KB raw / 2.05 KB gzip.

## Missed leverage

F-1-7 is the only useful missing capability implied by the brief: a supported one-time purchase for the already implemented multi-device and one-hour entitlement. An AI feature would send private clipboard text toward a cloud model and does not help this deterministic local handoff. Import/export, cloud sync, file transfer, and clipboard history conflict with explicit non-goals.

## Verification summary

- Fresh clone: `/tmp/clb-review4-eUWGtt/repo`, candidate `3163060`.
- `npm ci`: PASS; 67 packages and zero reported vulnerabilities.
- All 23 declared claim commands: exited 0; F-4-1 documents the false-positive coverage result.
- `npm test`: PASS; 3 Vitest, 3 Node, 52 Playwright, and 8 Rust tests.
- `npm run check`: PASS.
- `npm run build`: PASS; produced `dist/app/` and `dist/site/`.
- Live cold read, demo reset/storage, focus, routes, links, console, responsive layout, metadata, and Axe: PASS except F-4-1.
- No product code, deployment, infrastructure, billing, DNS, secrets, or unrelated resources were changed or accessed.

## What would make this perfect

Enable and end-to-end test the one-time Sociobot purchase, or formally change the brief to legacy-license recovery only. Correct the public-page network claim and its test so the license verification request is explicitly disclosed and covered. Remove or list the GitHub Actions implementation claim. Then rerun every declared command and this full live checklist; zero findings would remain.
