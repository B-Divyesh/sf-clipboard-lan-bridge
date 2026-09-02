# Clipboard LAN Bridge — verified release handoff

## Result: PASS

Independent verification of candidate `099d7517519f4a612e4f614360b85b726f6dda25` and <https://clipboard-lan-bridge.sociobot.in> passed on 2026-09-02. The app pairs one nearby device, sends encrypted short text or links directly over the LAN, expires free transfers after two or ten minutes, and does not require an account, cloud relay, or clipboard monitoring.

## What changed in this verification

- Ran all 19 independently declared claims before other QA; all passed.
- Checked live first-read, demo isolation/recovery, 32 KB Unicode rejection, desktop and 390 px rendering, keyboard/focus, Axe, errors, network boundary, headers, caching, links, package release, and deployment identity.
- Installed the README-documented Linux Tauri prerequisites only in this disposable verifier container so full-feature clippy could run; no product code changed.

## Verification

Executed from a clean dependency install on 2026-09-02:

```sh
npm ci
npm test
npm run check
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

All passed. `npm test` covered 3 Vitest tests, 5 release/provenance tests, 44 Playwright checks across desktop and 390 px mobile, and 8 Rust protocol tests. All 19 commands declared in `.factory/claims.json` were also run independently and passed. Full-feature `cargo clippy` passed after installing the README-listed Linux GUI prerequisites.

Live Playwright verification found no console/page errors, specific titles, `lang="en"`, one h1, a main landmark, complete image alt text, or serious/critical Axe findings across public routes in desktop and 390 px viewports. Fresh live demo flow requests stayed same-origin. Evidence is in [verification-6.md](verification-6.md).

The static build produced 4.23 KB JavaScript (1.63 KB gzip) and 9.45 KB CSS (2.74 KB gzip) for the landing bundle; the 65.81 KB responsive hero remains under budget.

## Run locally

```sh
npm ci
npm test
npm run check
npm run build
npm run tauri dev
```

Visit `http://127.0.0.1:4173/demo/` after `npm run dev:site` to open the isolated sample flow.

## Release and deployment

- Release [`v0.1.7`](https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/tag/v0.1.7) is published from `742a2aaa0f145033c2cd8d9ee3266169074cde22`, with packages for Linux, Windows, macOS arm64, and macOS x86_64 plus checksums and `latest.json`.
- A freshly downloaded Linux RPM matched `SHA256SUMS`: `0cb6265ccb6c20299f87afd0db7ae78a0fc689306fdc8ac183e59695760511f3`.
- The candidate’s static build and live root/demo/privacy/terms/JS/CSS files are byte-identical. Live root SHA-256 is `b0a445750eaa1cc166ff3eea36da40e71ffb4606262a0d696ef05e0b8ba1c0de`.

## Known gap / next step

The researched one-time monetization is intentionally absent because the product-scoped checkout endpoint was unavailable. The shipped free route remains complete and does not advertise a dead purchase. Restoring paid unlocks requires a separate authorized work order and a full checkout-to-native-restore verification. No shared billing or unrelated resource was accessed or changed.
