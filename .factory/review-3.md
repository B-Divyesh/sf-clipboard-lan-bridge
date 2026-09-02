# Adversarial first-read review 3

## Verdict: FAIL

- Product: Clipboard LAN Bridge
- Live URL: <https://clipboard-lan-bridge.sociobot.in/>
- Candidate: `4c5f90467758248b727c513f4376903d8ba9a508`
- Reviewed: 2026-09-02 UTC
- Work order: `clipboard-lan-bridge-review-3`

The public checkout link is dead. This is a blocking failure: a first-time
visitor can see a $9 offer and choose **Buy the $9 license**, but that action
opens a JSON 404 response instead of checkout. All other checks below passed.

## Findings

### Blocking

#### F-1-7 — The advertised $9 purchase path is unavailable

- Exact location: landing pricing card and README. The action is **“Buy the $9
  license”** and its exact URL is
  `https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout`.
- Observed result: a cold Chromium click navigated to that URL and showed
  `{"error":"enabled factory product","status":404}`. A direct `curl -L`
  check also returned HTTP 404 on 2026-09-02. The other public/internal links
  tested returned 200.
- Why this fails: the card promises “$9 once” and “No paired-device limit,”
  but the named result cannot be obtained. It is also a dead link, contrary to
  the route/link requirement. This is the earlier purchase finding again: the
  link is now visible, but it still does not reach a usable purchase flow.
- Code/test evidence: [site/index.html](../site/index.html) hard-codes the
  broken URL. `@claim:paid-unlock` only asserts that the anchor has that href;
  it neither opens checkout nor asserts a non-error checkout page. It therefore
  exits 0 while the visitor-facing claim fails.
- Concrete fix: provision or configure the product-scoped Sociobot checkout so
  this public GET leads to a real checkout page, or remove the paid offer,
  license-buy links, and paid entitlement copy until it does. Extend
  `@claim:paid-unlock` with an end-to-end browser check against the deployed
  checkout that rejects an error response and verifies the checkout page or a
  documented successful redirect. Keep the existing recorded return-token test.

No minor findings were found.

## First-screen record, before scrolling

| Viewport | What it does | Who it is for | First action | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Moves a link, address, or note as text between a phone and computers on one local network. | The person using their own nearby devices. | **Try it with sample data**. | PASS |
| 1440 × 900 | Sends short text to nearby devices on the local network. | The person using their own nearby phone and computers. | **Try it with sample data**. | PASS |

Exact first-screen support is the heading **“Send text to nearby devices”** and
the sentence **“Move one link, address, or note between your phone and
computers on the same local network.”** The primary demo action and three facts
are visible at both sizes. There was no horizontal overflow or normal-load
console error.

## Copy audit

Method: count whitespace-delimited words in every prose sentence on the live
landing page and in `README.md`. Headings, controls, and labels were also read
for jargon, terminology, empty mood copy, and result-naming actions. No
sentence exceeds 22 words. The technical terms in the install commands are
necessary command names and are accompanied by a concrete action.

### Landing-page sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 16 | Move one link, address, or note between your phone and computers on the same local network. | — |
| 9 | Your operating system may show an unverified-publisher warning. | — |
| 6 | Both screens show the same code. | — |
| 8 | The receiving device must approve before pairing completes. | — |
| 11 | Paste or type text, pick a device, then choose Send text. | — |
| 5 | The clipboard is never monitored. | — |
| 8 | The encrypted text arrives over your local network. | — |
| 7 | Copy it before its time runs out. | — |
| 10 | Clipboard LAN Bridge handles UTF-8 text and web links only. | — |
| 9 | It does not read clipboard changes, images, or files. | — |
| 9 | The site selects the current package for your computer. | — |
| 15 | Compare the file’s SHA-256 value with the value in the release page before opening it. | — |
| 10 | On macOS or Linux, run `shasum -a 256 FILE`. | — |
| 8 | On Windows, run `Get-FileHash FILE -Algorithm SHA256`. | — |
| 14 | To connect a phone, open the local phone address shown by the desktop app. | — |
| 9 | Keep the phone page open until the transfer arrives. | — |
| 6 | Send short text between nearby devices. | — |
| 4 | Built by Param Factory. | — |

The short facts and headings are informative rather than mood copy:
**No cloud service**, **No clipboard monitoring**, **Free for one paired
device**, **How it works**, **Privacy limits**, **One-time purchase**,
**Install the desktop app**, and **Desktop walkthrough**. The controls name
their results, including **Try it with sample data**, **Download the desktop
app**, **Buy the $9 license**, **Verify this download**, and **Copy install
command**. The price action is the one exception in behaviour, F-1-7.

### README sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 10 | Send short text and links between your own nearby devices. | — |
| 9 | Packages are available for Linux, macOS, and Windows. | — |
| 12 | Its phone page works in a phone browser on the same Wi-Fi. | — |
| 15 | Use it when you would otherwise message yourself a link, address, command, or short note. | — |
| 8 | Both devices display the same six-character pairing code. | — |
| 10 | The receiving device must approve it before transfers can start. | — |
| 5 | Transfers are encrypted after pairing. | — |
| 12 | The app rejects a transfer if its ID or expiry time changes. | — |
| 9 | It also rejects the same transfer a second time. | — |
| 10 | Only valid UTF-8 text up to 32 KB is accepted. | — |
| 8 | Free transfers expire after 2 or 10 minutes. | — |
| 11 | Clipboard reads and writes happen only after you choose a button. | — |
| 13 | The desktop app stores its identity, paired-device keys, and license on this computer. | — |
| 5 | Active transfers stay in memory. | — |
| 10 | Uninstall the app and remove its data to clear them. | — |
| 9 | Keep the phone page open until the transfer arrives. | — |
| 13 | The phone page accepts 30 requests from one network address every 10 seconds. | — |
| 14 | After that, it asks the browser to wait before trying again (`429` with `Retry-After`). | — |
| 13 | This is a personal tool for your local network, not a password manager. | — |
| 11 | Pair only on networks you trust and compare the displayed code. | — |
| 14 | Requirements: Node.js 22+, Rust stable, and the Tauri 2 prerequisites for your operating system. | — |
| 8 | Run the product site with `npm run dev:site`. | — |
| 6 | Open `http://127.0.0.1:4173/?demo=1` after starting the site. | — |
| 14 | The sample saves data only in this browser tab under a separate `demo:` key. | — |
| 8 | It never writes sample transfers to app data. | — |
| 12 | In the installed app, choose **Load sample transfer**. | — |
| 14 | The sample uses a separate `demo:` browser-session key and does not write app data. | — |
| 17 | Run `npm test` to check unit logic, browser accessibility, product claims, screen sizes, and local transfer behavior. | — |
| 17 | Run `npm run build`; it creates the desktop app files in `dist/app/` and the website in `dist/site/`. | — |
| 9 | Build a local desktop package with the following command. | — |
| 8 | On Linux, install these desktop build packages first. | — |
| 9 | GitHub Actions builds packages for macOS, Windows, and Linux. | — |
| 9 | Your operating system may show an unverified-publisher warning. | — |
| 8 | On macOS, right-click the app and choose **Open**. | — |
| 6 | On Windows, confirm the publisher warning. | — |
| 9 | Packages and SHA-256 checksums are in the latest release. | — |
| 7 | The site bundles the current release manifest. | — |
| 7 | Public pages contact only this product website. | — |
| 10 | The free plan connects this computer and one paired device. | — |
| 11 | A $9 one-time license removes the paired-device limit and enables one-hour transfers. | F-1-7 |
| 9 | You can buy it from the Sociobot checkout. | F-1-7 |
| 14 | Existing license holders can paste a token under **Existing license** in the desktop app. | — |
| 11 | After checkout, copy the returned token into **Existing license** in the desktop app. | F-1-7 |
| 7 | Terms and refund information are available at `/terms/`. | — |
| 6 | Code is MIT licensed; see [LICENSE](../LICENSE). | — |
| 11 | Product data practices are at `/privacy/`, and terms are at `/terms/`. | — |

Terminology is consistent: the event is a **transfer**, an endpoint is a
**paired device**, authorization is **pairing**, the boundary is a **local
network**, and the trial is a **demo**. Claim-like landing/README statements
map to entries in `.factory/claims.json`; no unlisted claim was found. The
paid statements have an entry, but its observable checkout result fails
(F-1-7).

## Demo and sandbox

PASS except that the commercial route outside demo is blocked by F-1-7.

- The landing action enters `/demo/` in one click. The first screen already
  shows two paired sample devices, prefilled rail-booking text, and a received
  grocery-list transfer.
- The persistent banner reads **“Demo — sample data, nothing is saved”** and
  provides **Reset demo** and **Download the desktop app**.
- After a send and Reset, the text returned to the seeded 74-byte handoff, the
  ten-minute option was selected, the grocery arrival was restored, and errors
  were clear.
- The demo used only
  `sessionStorage["demo:clipboard-lan-bridge:tickets"]`; `localStorage` was
  empty and no real-data namespace was read or written.
- Fresh browser request logs for landing and demo contained only
  `https://clipboard-lan-bridge.sociobot.in`. No analytics, external font,
  CDN, or API request occurred in the demo flow.
- The installed-app sample path and the captioned three-frame desktop
  walkthrough are present. The `desktop-sample` claim test passed.

## Declared claims

All 23 commands listed in `.factory/claims.json` were run individually from a
fresh local clone (`/tmp/clipboard-review3-UOZwoB`) after `npm ci`. Every
command exited 0.

| Claim IDs | Result |
| --- | --- |
| `release-packages`, `release-provenance` | PASS |
| `unsigned-packages`, `platform-download`, `public-page-network-boundary` | PASS |
| `paid-unlock`, `merchant-refund-terms` | Command PASS; observable checkout failure is F-1-7. |
| `sample-demo`, `desktop-sample` | PASS |
| `lan-only`, `end-to-end-encryption`, `explicit-pairing` | PASS |
| `phone-companion`, `companion-api-allowance` | PASS |
| `no-clipboard-monitoring`, `explicit-clipboard-write`, `app-data-boundary` | PASS |
| `text-32kb`, `expiry`, `no-telemetry`, `no-account` | PASS |
| `two-device-free-tier`, `native-license-verification` | PASS |

The claim suite exposes an additional test-coverage defect within F-1-7: its
payment test tests a string value, not the result the visitor relies on.

## Earlier findings: live and code confirmation

| Earlier finding | Status in this review | Confirmation |
| --- | --- | --- |
| F-1-1 | Fixed | Release test fetched the manifest/checksums and hashed platform packages. |
| F-1-2 | Fixed | Companion page/API pairing and encrypted round trip passed. |
| F-1-3 | Fixed | Native lifecycle rejects a transfer before receiver approval. |
| F-1-4 | Fixed | 32,768-byte acceptance and over-limit rejection passed. |
| F-1-5 | Fixed | Controlled-clock tests remove both free expiry choices. |
| F-1-6 | Fixed | Unsupported signed-release language is absent. |
| F-1-7 | Unfixed/regressed — BLOCKING | The now-visible checkout link returns 404. |
| F-1-8 | Fixed | Copy is the tested unverified-publisher warning, not an artifact-signing assertion. |
| F-1-9 | Fixed | Password-autofill language remains absent. |
| F-1-10 | Fixed | Detailed discovery-payload language remains absent. |
| F-1-11 | Fixed | Untested algorithm names remain absent from public copy. |
| F-1-12 | Fixed | The actionable phone-page instruction remains. |
| F-1-13 | Fixed | `/` → `/demo/` and browser Back focus the destination h1. |
| F-1-14 | Fixed | Operational copy consistently uses transfer and paired-device terms. |
| F-1-15 | Fixed | The expiry copy gives the two specific free choices. |
| F-1-16 | Fixed | The landing states the tested end-to-end encryption result. |
| F-1-17 | Fixed | Unsupported “community build” wording remains absent. |
| F-1-18 | Fixed | Both install controls have explicit OS-specific accessible names. |
| F-1-19 | Fixed | Plain checksum instructions and **Verify this download** are present. |
| F-1-20 | Fixed | The README pairing/encryption heading remains plain and specific. |
| F-1-21 | Fixed | The README consistently says six-character pairing code. |
| F-1-22 | Fixed | Changed ID, changed expiry, and replay behavior are stated in observable language. |
| F-1-23 | Fixed | The README says which local values persist and how to clear them. |
| F-1-24 | Fixed | The rate-limit sentence begins with the browser-visible result. |
| F-1-25 | Fixed | Demo storage remains described as a browser session under a separate `demo:` key. |
| F-1-26 | Fixed | Test documentation uses the direct `npm test` instruction. |
| F-1-27 | Fixed | Build documentation names the actual two output directories. |
| F-1-28 | Fixed | Required Linux desktop packages remain explicitly listed. |
| F-1-29 | Fixed | Unsupported installer-verification language remains absent. |
| F-1-30 | Fixed | The tested public-page network-boundary statement remains in visitor language. |
| F-1-31 | Fixed | Factory implementation/deployment claims remain absent. |
| F-1-32 | Fixed | Release provenance remains listed and its public-manifest test passed. |
| F-1-33 | Fixed | Generated-artwork slogan remains absent; provenance stays in `design.md`. |
| F-2-1 | Fixed | Reset restored all seeded form and arrival state. |
| F-2-2 | Fixed | Native sample path and three captioned app screenshots are present and tested. |
| F-2-3 | Fixed | README says packages are available instead of untested runtime support. |
| F-2-4 | Fixed | Current merchant/refund wording and the claim are present. |
| F-2-5 | Fixed | The paid tier states no paired-device limit. |
| F-2-6 | Fixed | The obsolete checkout-build instruction is absent. |
| F-2-7 | Fixed | The local-network/cloud-service terminology is consistent. |
| F-2-8 | Fixed | Approval says it is required on the receiving device. |
| F-2-9 | Fixed | The 404 label is **Page not found**. |
| F-2-10 | Fixed | Demo exit says **Download the desktop app**, targets download, and clears demo data. |

## Structure, accessibility, and links

- PASS: `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed unknown-route
  404 have `lang=en`, exactly one h1, main landmark, route-specific title,
  description, canonical URL, Open Graph/Twitter fields, favicon, and apple
  touch icon.
- PASS: the header/footer are consistent; Privacy and Terms work; internal
  routes, source repository, releases, install scripts, robots, and sitemap
  returned 200. The checkout link is the sole dead link (F-1-7).
- PASS: 390px and desktop had no horizontal overflow or normal page errors.
  Direct navigation and Back focus the destination h1.
- PASS: header CSP includes response-header `frame-ancestors 'none'`; public
  route request logs stayed same-origin. The art-deco transit-poster system,
  warm-paper palette, rail geometry, and original artwork match `design.md`
  and are not a generic SaaS template.

## Missed leverage

No AI step is appropriate: model access would require sending the very text
this local-only transfer tool is designed not to send to a cloud service.
Cloud sync, image/file transfer, and clipboard history contradict explicit
non-goals. The obvious missing value is a working purchase path, F-1-7.

## What would make this perfect

Make the public $9 action open a functioning product-scoped Sociobot checkout,
verify that journey in the claim test, and rerun this checklist from a clean
clone. Then there would be no remaining finding.
