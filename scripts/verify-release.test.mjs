import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
