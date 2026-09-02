import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const repo = "B-Divyesh/sf-clipboard-lan-bridge";
const bundledManifest = JSON.parse(readFileSync(new URL("../site/release-manifest.json", import.meta.url), "utf8"));

async function get(url) {
  const response = await fetch(url, { headers: { "User-Agent": "clipboard-lan-bridge-claim-test" } });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response;
}

async function publishedRelease() {
  const release = await (await get(`https://api.github.com/repos/${repo}/releases/tags/${bundledManifest.version}`)).json();
  const byName = new Map(release.assets.map(asset => [asset.name, asset]));
  const manifestAsset = byName.get("latest.json");
  const sumsAsset = byName.get("SHA256SUMS");
  assert.ok(manifestAsset, "published release needs latest.json");
  assert.ok(sumsAsset, "published release needs SHA256SUMS");
  const manifest = await (await get(manifestAsset.browser_download_url)).json();
  const sums = await (await get(sumsAsset.browser_download_url)).text();
  return { release, byName, manifest, sums };
}

test("@claim:release-packages current published release has verified packages for every desktop platform", async () => {
  const { byName, manifest, sums } = await publishedRelease();
  assert.equal(manifest.version, bundledManifest.version);
  const required = { linux: ["appimage", "deb", "rpm"], windows: ["msi", "exe"], macos: ["dmg"] };
  for (const [platform, kinds] of Object.entries(required)) {
    const assets = manifest.assets.filter(asset => asset.platform === platform);
    for (const kind of kinds) assert.ok(assets.some(asset => asset.kind === kind), `${platform} needs a ${kind} package`);
    const asset = assets[0];
    assert.ok(byName.has(asset.name), `${asset.name} is missing from the GitHub release`);
    assert.match(sums, new RegExp(`^${asset.sha256}\\s+\\*?${asset.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));
    const bytes = new Uint8Array(await (await get(asset.url)).arrayBuffer());
    const actual = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actual, asset.sha256, `${asset.name} checksum does not match latest.json`);
  }
});

test("@claim:release-provenance published release manifest names its exact source commit", async () => {
  const { manifest } = await publishedRelease();
  assert.equal(manifest.version, bundledManifest.version);
  assert.match(manifest.source_commit, /^[0-9a-f]{40}$/);
  assert.ok(manifest.assets.length >= 7);
});

test("release workflow creates checksums and a machine-readable manifest", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  for (const expected of ["ubuntu-latest", "windows-latest", "macos-latest", "SHA256SUMS", "latest.json", "softprops/action-gh-release"]) {
    assert.match(workflow, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
