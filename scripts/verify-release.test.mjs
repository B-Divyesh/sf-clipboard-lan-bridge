import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bundledManifest = JSON.parse(readFileSync(new URL("../site/release-manifest.json", import.meta.url), "utf8"));

test("@claim:release-packages workflow publishes every desktop platform with checksums", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  for (const expected of ["ubuntu-latest", "windows-latest", "macos-latest", "SHA256SUMS", "latest.json", "softprops/action-gh-release"]) {
    assert.match(workflow, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const shellInstaller = readFileSync(new URL("../site/public/install.sh", import.meta.url), "utf8");
  const powershellInstaller = readFileSync(new URL("../site/public/install.ps1", import.meta.url), "utf8");
  assert.match(shellInstaller, /sha256/i);
  assert.match(powershellInstaller, /SHA256/i);
});

test("release workflow provisions the Linux GUI toolchain before the Tauri package build", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  for (const packageName of ["libwebkit2gtk-4.1-dev", "libappindicator3-dev", "librsvg2-dev", "patchelf", "rpm"]) {
    assert.match(workflow, new RegExp(packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(workflow, /Install Linux bundle dependencies[\s\S]*npm ci[\s\S]*Run complete quality gates[\s\S]*tauri-apps\/tauri-action/);
  assert.match(workflow, /npm run check && npm test/);
  assert.match(workflow, /npm run check && npm run test:core/);
  assert.match(workflow, /Install Playwright Chromium[\s\S]*npx playwright install chromium[\s\S]*Run complete quality gates/);
});

test("release provenance records the exact tagged source commit", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.match(workflow, /SOURCE_COMMIT:\s*\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /source_commit:\s*process\.env\.SOURCE_COMMIT/);
});

test("bundled landing manifest has release downloads and checksums for every platform", () => {
  assert.match(bundledManifest.version, /^v\d+\.\d+\.\d+$/);
  assert.match(bundledManifest.source_commit, /^[0-9a-f]{40}$/);
  for (const platform of ["linux", "macos", "windows"]) {
    const assets = bundledManifest.assets.filter(asset => asset.platform === platform);
    assert.ok(assets.length > 0, `${platform} must have at least one package`);
    for (const asset of assets) {
      assert.match(asset.sha256, /^[0-9a-f]{64}$/);
      assert.equal(asset.url, `https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/download/${bundledManifest.version}/${encodeURIComponent(asset.name)}`);
    }
  }
});
