import { chromium } from "@playwright/test";

const base = "https://clipboard-lan-bridge.sociobot.in";
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const links = new Set();
for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  for (const href of await page.locator("a").evaluateAll(anchors => anchors.map(anchor => anchor.href))) links.add(href);
}
const results = [];
for (const href of [...links].sort()) {
  const url = new URL(href);
  if (["mailto:"].includes(url.protocol) || url.hash) {
    results.push({ href, result: "explicit navigation" });
    continue;
  }
  const response = await fetch(href, { method: "HEAD", redirect: "manual", headers: { "user-agent": "clipboard-lan-bridge-independent-qa" } });
  results.push({ href, status: response.status, location: response.headers.get("location") });
}
console.log(JSON.stringify(results, null, 2));
await context.close();
await browser.close();
process.exitCode = results.some(result => result.status && result.status >= 400) ? 1 : 0;
