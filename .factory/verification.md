# Independent product verification

## Verdict: FAIL

- Candidate: `86ba76033386b2b305b66857c4dd5f68c8511446`
- Live URL: <https://clipboard-lan-bridge.sociobot.in>
- Verified: 2026-08-30 UTC
- Work order: `clipboard-lan-bridge-verify-1`

The candidate is not releasable. It fails mandatory claims/demo gates, does not fulfill the phone-to-computer job in the researched brief, has a broken paid-license path, fails its type-check gate, and contains a serious WCAG contrast defect.

## Release-blocking findings

### 1. Required claim registry and claim tests are absent

The very first clean-checkout gate found no `.factory/claims.json` and exited with `RELEASE_BLOCKER: .factory/claims.json missing`. `rg` also found no `@claim:*` tests. Therefore none of the landing/README promises has the required sandbox proof. Unlisted examples include LAN-only transfer, end-to-end encryption, no clipboard monitoring, 32 KB enforcement, expiry, no telemetry, the two-device free tier, and the paid unlimited-device tier.

### 2. The mandatory sample demo and first-read experience are absent

- There is no visible “Try it with sample data” action.
- `GET /demo` returns the normal landing page byte-for-byte, with no sample transfer, demo banner, reset, or separate storage namespace.
- `.factory/demo.md` is absent.
- Cold desktop layout placed the download action at y=892–944 in a 900 px viewport, leaving only 8 px visible. At 390×844 it was fully below the fold.
- The headline is the metaphor “A private route across your desk,” not the job in plain words. The first screen therefore does not plainly provide what, who, and a first action in the required shape.

This gate alone requires FAIL under the work order.

### 3. The researched cross-device job is incomplete

The acceptance brief requires nearby phone, Linux, macOS, and Windows handoff. The candidate ships Linux/macOS/Windows desktop packages only and explicitly says the phone companion has not shipped. The disclosure is honest, but the smallest useful product in the acceptance contract is not delivered.

### 4. The $9 paid unlock does not work from the installed app

Fresh evidence:

- The verification API returned `Access-Control-Allow-Origin` for `https://clipboard-lan-bridge.sociobot.in`, but no such header for either `tauri://localhost` or `http://tauri.localhost`.
- Loading the app UI at a Tauri-like `http://tauri.localhost` origin and selecting “Verify license” produced a browser CORS error and the app message “Could not verify right now.”
- A simulated checkout return to `/?license=qa-dummy-return` stripped the query string and saved the token only in the website origin's local storage. The page offered no copy/restore handoff. The installed Tauri webview uses a different origin and cannot read that token.

The gate is also inconsistent even if verification were reachable: `FREE_DEVICE_LIMIT` is `2` paired peers, so the advertised “two devices” route permits the local device plus two peers; incoming approvals are never checked against the limit; Rust pairing commands have no license check; and `send_text` accepts the paid 3600-second expiry without checking a license. The UI trusts a writable local-storage verdict.

### 5. The advertised type/check gate fails from the clean install

`npm run check` exits 2 before Cargo runs:

```text
tests/app.spec.ts(11,42): error TS2740: Type 'Page' is missing ...
tests/site.spec.ts(12,42): error TS2740: Type 'Page' is missing ...
```

The lockfile resolves `@axe-core/playwright@4.13.0` with `playwright-core@1.62.1`, while the project pins `@playwright/test`/Playwright 1.58.2.

### 6. Serious accessibility defect in the app

Axe on the Route pass view reports one serious `color-contrast` violation. “Personal route pass” renders `#9e351f` on `#102a2b` at 12 px bold: 2.14:1 versus the required 4.5:1. The shipped Playwright suite opens this view but does not run axe there, so it misses the defect.

## Other defects

### High

- The automated suite never performs a real pair → approve → send → receive → copy → expire flow. Browser tests exercise only the non-Tauri empty preview; Rust tests cover crypto primitives and size rejection. With no demo and only one native host available, the actual job remains unproven.
- A paired LAN observer can replay a captured encrypted transfer with a new unauthenticated `transfer_id` and modify unauthenticated expiry metadata. The ciphertext is authenticated, but transfer identity/timing are not bound as AEAD associated data.

### Medium

- The live site has no `Content-Security-Policy` header. The checked-in Static Web Apps policy also defines none.
- Missing required site structure: canonical URL, Open Graph image, Twitter metadata, favicon/apple-touch icon, `robots.txt`, `sitemap.xml`, and a real 404. Unknown routes, `/robots.txt`, and `/sitemap.xml` all return the landing HTML with status 200. Lighthouse reports 65 robots errors.
- Multiple landing links are under the 44 px touch-target minimum; examples include 25 px header links and 20 px footer links. The app wordmark is 40 px tall at 390 px.
- A 200% Chromium text-zoom proxy at 390 px produces horizontal width 640 px on both landing and app views, so content does not reflow without horizontal scrolling.
- First offline reload succeeds from the service worker, but the automatic GitHub release fetch emits `net::ERR_INTERNET_DISCONNECTED` in the console before the calm fallback message appears.
- `.factory/copy-audit.md` is missing. The landing page uses metaphorical section language and includes copy beyond the attached plain-word limits.
- The documented native bundle command fails under this worker's common `CI=1` setting because Tauri accepts only `CI=true|false`. With `CI=true`, the Debian bundle builds successfully.

## Passing evidence

### Clean install, tests, and builds

- Initial repository state was clean at the candidate SHA.
- `npm ci`: pass; 63 packages installed; 0 audit vulnerabilities.
- First `npm test`: TypeScript/browser portions passed, then Rust could not find the host Tauri libraries. After installing exactly the release workflow's Linux prerequisites, the full rerun passed: 3 Vitest, 8 Playwright executions (desktop/mobile), and 3 Rust tests.
- `npm run build`: pass. Output exists at `dist/app/` and `dist/site/`.
- `CI=true npm run tauri build -- --bundles deb`: pass; produced `src-tauri/target/release/bundle/deb/Clipboard LAN Bridge_0.1.2_amd64.deb`.

### Live identity and release/installability

- Live landing, privacy, terms, JS, CSS, both hero images, installers, service worker, and contrast stylesheet matched the candidate build byte-for-byte.
- Release `v0.1.2` contains Linux AppImage/deb/rpm, Windows MSI/exe, and arm64/x86_64 macOS DMGs plus `latest.json` and `SHA256SUMS`.
- The tag is `9dfa2c5`; its only difference from the candidate is `.factory/handoff.md`, so shipped product code is identical.
- Fresh isolated installer run downloaded and installed the Linux AppImage at mode 755. SHA-256 `3b3cf0856edb9f884b934ff017fea42f8e239007178270f6052d19259f943fd8` matched both manifests.
- The extracted release app launched under Xvfb and listened on TCP 38741 and UDP 38742.

### Functional boundaries and recovery

- Browser preview correctly rejects blank text.
- It rejects 32,769 ASCII bytes and 8,193 four-byte Unicode characters.
- Exactly 32,768 ASCII bytes pass size validation and proceed to the expected “Choose an online destination” state.
- Replacing invalid data with a normal URL clears the size error and reaches the same recoverable destination state.
- Baseline desktop and 390 px layouts had no horizontal overflow. Keyboard focus was visible and all tested controls were reachable. Reduced-motion mode had no active animations.

### Accessibility, privacy, headers, and performance

- Live landing, privacy, and terms: zero axe serious/critical violations at desktop and 390 px.
- Online cold loads: no console or page errors; `lang`, title, one `h1`, `main`, alt text, and skip link present.
- Outgoing live-page requests were same-origin assets plus the disclosed GitHub releases API only. No analytics/tracking requests were observed.
- Useful response headers present: HSTS, `nosniff`, `no-referrer`, and restrictive camera/microphone/geolocation policy.
- Static asset caching is `max-age=31536000, immutable`; HTML is `max-age=30, must-revalidate`; service worker and installers are not cached.
- Initial site JS 3.39 KB raw / 1.56 KB gzip; CSS 8.14 KB raw / 2.44 KB gzip; mobile hero 32.47 KB. App JS 14.33 KB raw / 5.25 KB gzip; CSS 9.09 KB raw / 2.82 KB gzip.
- Fresh Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 92; FCP 1.1 s, LCP 1.1 s, TBT 30 ms, CLS 0.
- Product verification endpoint rate limit passed: 30 successful invalid-license requests in the observed short window; request 31 returned 429 with `Retry-After: 3`.
- No sign-in exists, so Entra tenant validation is not applicable. The product does not need an AI feature.

## Required before reverification

1. Add `.factory/claims.json` and one observable demo-sandbox test per claim.
2. Add the one-click sample-data demo, persistent demo banner/reset/exit, and `.factory/demo.md`; rewrite the first screen in plain words.
3. Deliver the phone companion required by the brief or obtain a revised acceptance scope.
4. Repair the desktop license return, CORS, and native enforcement paths; test purchase/restore/revocation without a live charge.
5. Make `npm run check` pass from `npm ci` and cover the real native transfer lifecycle.
6. Fix the Route pass contrast and remaining touch/zoom issues.
7. Add the missing CSP, metadata, crawler files, and real 404 behavior.
