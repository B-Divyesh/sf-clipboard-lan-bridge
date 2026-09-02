import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const base = "https://clipboard-lan-bridge.sociobot.in";
const root = new URL("../../../dist/site/", import.meta.url);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(path.relative(root.pathname, file));
  }
}

walk(root.pathname);
const results = [];
for (const file of files.sort()) {
  if (file === "staticwebapp.config.json") continue;
  let route = `/${file}`;
  if (file === "index.html") route = "/";
  else if (route.endsWith("/index.html")) route = route.slice(0, -10);
  const response = await fetch(`${base}${route}`, { cache: "no-store" });
  const remote = Buffer.from(await response.arrayBuffer());
  const local = fs.readFileSync(path.join(root.pathname, file));
  const localSha256 = crypto.createHash("sha256").update(local).digest("hex");
  const remoteSha256 = crypto.createHash("sha256").update(remote).digest("hex");
  results.push({ file, status: response.status, local_sha256: localSha256, remote_sha256: remoteSha256, match: localSha256 === remoteSha256 });
}

const report = { checked_at: new Date().toISOString(), count: results.length, all_match: results.every(result => result.match), results };
fs.writeFileSync(new URL("live-identity.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(`identity ${report.all_match ? "PASS" : "FAIL"}: ${report.count} files`);
if (!report.all_match) process.exit(1);
