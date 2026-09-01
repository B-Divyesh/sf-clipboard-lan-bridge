# Independent product verification 2

## Verdict: FAIL

- Candidate: `99624b4844d1e2b7a6ccb383b53d6bb46432559f`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-09-01 UTC
- Work order: `clipboard-lan-bridge-verify-2`

The candidate passes its declared claims, clean local gates, first-read check, core transfer tests, download checks, and the main accessibility and performance checks. It is not releasable because the advertised paid checkout returns 404, the LAN companion API has no enforced request allowance, and the downloadable desktop packages were built from an older commit rather than this candidate.

## Release-blocking findings

### 1. The advertised $9 purchase cannot be started

The live **Buy route pass** action points to:

`https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout`

A fresh GET on 2026-09-01 returned HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

The link is present in `site/index.html:64`. This is the prior deployment-side condition checked again from fresh evidence. The license verification endpoint itself remains available: a dummy token returned HTTP 200 with `{"expires_at":null,"reason":"invalid","valid":false}`. The website also accepts a checkout-return token and removes it from the URL, but a customer cannot reach checkout from the advertised action.

The availability of the paid purchase path is also not represented by its own claim test. `paid-route-pass` checks entitlement behavior after a valid verdict, and `license-handoff` injects a recorded token; neither confirms that the public checkout starts.

### 2. The LAN phone API has no request allowance or 429 response

The installed desktop app exposes `/api/pair`, `/api/status`, `/api/send`, and `/api/inbox` on its LAN companion server. The router at `src-tauri/src/lib.rs:727` has no request-limiting layer, no documented allowance, and no 429 response path.

Fresh runtime evidence against an isolated released app instance:

- 40 consecutive requests from one client to `/api/status` all returned 200.
- No response included `Retry-After`.
- Repository search found no `429`, `Retry-After`, or `StatusCode::TOO_MANY_REQUESTS` implementation.

This does not meet the work-order requirement that every server endpoint enforce a documented allowance and return 429 with `Retry-After` after that allowance.

For comparison, the product-specific license verification endpoint passed this check: requests 1–30 returned 200, request 31 returned 429, and `Retry-After: 3` was present. The observed allowance was 30 requests in the short window.

### 3. Downloadable desktop packages do not have candidate provenance

The live static site matches this candidate, but the desktop packages linked by that site were produced from tag `v0.1.3`, whose peeled commit is `550b4a5976bb939d453717fd782c498c390b2004`. The verified candidate is `99624b4844d1e2b7a6ccb383b53d6bb46432559f`.

There are runtime-source and build changes after the release tag, including `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `package.json`, and the release workflow. The latest packages therefore cannot be identified as builds of the candidate under review. A new release from the accepted candidate is required even though the older v0.1.3 Linux package launched successfully in this check.

## Other findings

### Medium: leaving the demo does not discard demo data

The demo contract says leaving demo mode discards its sample state. After sending `Should be discarded when leaving`, choosing **Start for real**, and reopening `/demo/` in the same tab, the sent ticket was still present. The link at `site/demo/index.html:14` is a plain home link, and `site/demo/main.ts` has no exit cleanup handler. Demo state remains isolated from real data, but it is not discarded on exit.

### Medium: copying a returned license raises a page error and gives no visual confirmation

With `/?license=qa-copy-feedback`, the panel displayed the token and the URL was cleaned correctly. Choosing **Copy license** copied the token and removed the local-storage value, but the button stayed **Copy license** and the page raised:

```text
Cannot set properties of null (setting 'textContent')
```

At `site/main.ts:79-81`, the async handler reads `event.currentTarget` after awaiting clipboard access. `currentTarget` is null after that asynchronous boundary. The required immediate action feedback is therefore missing.

### Medium: some interactive targets remain below 44 CSS pixels

Measured live examples:

- Desktop hero **Download for Linux**: 173 × 25 px.
- Header home wordmark: 148 × 42 px.
- Footer home wordmark: 87 × 37 px.
- Privacy email link at 390 px: 172 × 20 px.
- Terms email link at 390 px: 175 × 20 px.
- 404 **Return home** link: 110 × 20 px.

Keyboard focus is visible with a two-ring box shadow, and no keyboard trap was found. The issue is target size, not keyboard reachability.

### Low: the main heading leaves a one-letter final line

At both 1440 px and 390 px, the large uppercase heading wraps `DEVICES` as `DEVICE` followed by a lone `S`. It remains readable but weakens the otherwise product-specific presentation.

## Mandatory claims gate

`.factory/claims.json` exists. Every listed command was run exactly from the clean candidate checkout, including repeated commands for separate claims. All 16 entries passed:

| Claim | Result | Evidence |
| --- | --- | --- |
| `release-packages` | PASS | Node release-policy test passed. |
| `platform-download` | PASS | Two Playwright project executions passed. |
| `sample-demo` | PASS | Two Playwright project executions passed. |
| `lan-only` | PASS | Native loopback lifecycle test passed. |
| `end-to-end-encryption` | PASS | Authenticated metadata/ciphertext test passed. |
| `explicit-pairing` | PASS | Native pairing lifecycle test passed. |
| `phone-companion` | PASS | Phone P-256/AES-GCM round trip passed. |
| `no-clipboard-monitoring` | PASS | Two Playwright project executions passed. |
| `text-32kb` | PASS | Two Playwright project executions passed. |
| `expiry` | PASS | Two Playwright project executions passed. |
| `no-telemetry` | PASS | Two Playwright project executions passed. |
| `no-account` | PASS | Two Playwright project executions passed. |
| `two-device-free-tier` | PASS | Native free-tier limit test passed. |
| `paid-route-pass` | PASS | Native entitlement limit test passed. |
| `native-license-verification` | PASS | Two Playwright project executions passed. |
| `license-handoff` | PASS | Two Playwright project executions passed. |

The claim commands passed, but they do not cover the live checkout availability defect above.

## First-read test

PASS at desktop 1440 × 900 and mobile 390 × 844.

- What it does: **Send text to nearby devices**.
- For whom/situation: people moving a link, address, or note between their phone and computers on the same local network.
- First action: **Try it with sample data** is visible in the first viewport.
- One click opens `/demo/` with a persistent demo banner, two named sample devices, prepared text, and a realistic grocery-list arrival.

## Local verification

The repository began clean at the exact candidate SHA.

- `npm ci`: PASS; 67 packages audited, 0 vulnerabilities.
- `npm test`: PASS; 3 Vitest tests, 2 Node release tests, 32 Playwright executions, 6 Rust tests, and 0 failures.
- `npm run check`: PASS; TypeScript and GUI-independent native checks.
- `npm run build`: PASS; created `dist/app/` and `dist/site/`.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings`: PASS after installing the documented Linux Tauri libraries.

Production bundle sizes:

- Site JS: 3.64 KB plus 0.71 KB module preload helper, 1.95 KB gzip combined.
- Site CSS: 9.79 KB main, 3.56 KB demo, 1.30 KB legal; each is below 50 KB.
- Mobile hero: 32.47 KB; desktop hero: 65.81 KB.
- Desktop webview JS: 14.80 KB raw / 5.36 KB gzip.
- Desktop webview CSS: 10.07 KB raw / 3.04 KB gzip.

## Functional and recovery evidence

The live demo was exercised in a fresh 390 × 844 context.

- Normal URL handoff: PASS; the resulting ticket showed the URL and two-minute expiry.
- Copy: PASS; clipboard contained the sent text and the button changed to **Sample text copied**.
- Blank input: PASS; `Enter or paste something to send.` appeared and focus returned to the field.
- Exact 32,768-byte ASCII input: PASS.
- 32,769-byte ASCII input: PASS rejection with `Text must be 32 KB or less.`
- 8,193 four-byte Unicode characters: PASS rejection with the same message.
- Recovery: PASS; replacing invalid input with normal markup-like text sent it as escaped text, with no injected image or script.
- Two- and ten-minute expiry options: PASS.
- Expired sample: PASS; removed on reload and replaced by the empty state.
- Reset: PASS; restored the original grocery sample and removed sent samples.
- Demo storage: PASS isolation; only `demo:clipboard-lan-bridge:tickets` appeared in session storage, with no real-data key.

The native loopback test covered pair request, matching code, approval, encrypted send/receive, replay rejection, and expiry rejection. The released Linux app also started under Xvfb. Its real phone companion returned HTTP 200, showed a six-character pairing code after valid input, rejected a one-character phone name with a recovery message, made only local-origin requests, and had no serious/critical axe findings.

## Live deployment identity and installability

Every checked live static artifact matched `dist/site` byte-for-byte: `/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, crawler files, service worker, installers, images, JS, and CSS. The live root SHA-256 was `8910a104d9faa413138c55cdf048317c882e3e9881206e20b0f593c2c95b13b1`; service worker SHA-256 was `644db754dff5b74de03668a13b30a1eb5eada5595c1453d7b748d5640dec124d`.

Release `v0.1.3` contains Linux AppImage/DEB/RPM, Windows MSI/EXE, arm64/x86_64 macOS DMGs, `SHA256SUMS`, and `latest.json`. The downloaded DEB SHA-256 was `665dc8d6173a596fc2111860634ae32c9c067173111f117989a4a5ad6a112aa5`, matching both manifests.

The live one-line installer completed in an isolated directory, set executable mode, and installed an AppImage with SHA-256 `020ad191346daa36fd5715ce97edbf0c932fd9124c88c8ed456d3f72658bc7ee`. That installed AppImage launched and served its phone companion. Live user-agent checks selected the AppImage for Linux, MSI for Windows, and x86_64 DMG for macOS without console errors.

## Accessibility, privacy, headers, offline, and performance

- Live `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404 page had `lang=en`, one `h1`, one `main`, and no horizontal overflow at desktop or mobile.
- Axe found zero serious/critical issues on every route at both sizes.
- Keyboard traversal reached every demo control. Focus showed a 3 px paper ring plus a 6 px brass ring. Enter/Space operation worked and no trap was found.
- At 200% root text size on 390 px, all four public routes had no horizontal overflow or clipped element bounds.
- Reduced-motion mode had no running animation and computed smooth scrolling as `auto`.
- Normal successful routes had no console or page errors. The designed 404 produced only the browser's expected 404 resource message.
- The complete live demo flow made same-origin requests only. The landing page made same-origin asset requests plus the documented GitHub releases API request. No analytics, advertising, telemetry, third-party font, or third-party script request was observed.
- Headers included CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, `no-referrer`, and restrictive camera/microphone/geolocation policy.
- HTML caching was `public, must-revalidate, max-age=30`; hashed assets were `public, max-age=31536000, immutable`; service worker and installers were `no-cache`.
- Service worker update completed. Offline `/demo/` reload retained the banner and sample with no failed request or console error; cache name was `clipboard-lan-bridge-v3`.
- Fresh Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.0 s, TBT 140 ms, CLS 0.

No sign-in exists, so the Entra tenant check is not applicable. The product does not benefit from an added AI step. Library/CLI consumer-package checks are not applicable to this desktop-app artifact.

## Required before PASS

1. Enable and verify the product-specific checkout so the live buy action reaches hosted checkout.
2. Document and enforce a per-client allowance on every LAN companion API route, with 429 and `Retry-After` after the allowance.
3. Publish desktop packages from the accepted candidate commit and expose verifiable build identity.
4. Clear demo session state when **Start for real** is chosen and add a regression assertion.
5. Keep a stable button reference across the license-copy await so success/failure feedback works without a page error.
6. Bring all interactive targets to at least 44 × 44 CSS pixels and prevent the one-letter heading wrap.

