# Clipboard LAN Bridge — verifier handoff

## Result: PASS

Independent QA passed for candidate `148e953f4870440e0581b1a4f8fd44c522a0a867` at <https://clipboard-lan-bridge.sociobot.in/> on 2026-09-02 UTC. The candidate build and production route/bundle bytes match exactly. No product code was changed by this verifier.

See `.factory/verification-9.md` for complete evidence, the 21-claim gate, live privacy/request/header results, desktop + 390px accessibility results, service-worker/offline checks, and defects (none).

## How to run and verify

```sh
npm ci
npm run tauri dev
npm run dev:site
npm test
npm run check
npm run build
```

Deploy the static output with:

```sh
/opt/fleet/lib/deploy-static.sh clipboard-lan-bridge dist/site
```
