import fs from "node:fs";
import { chromium } from "@playwright/test";

const base = "https://clipboard-lan-bridge.sociobot.in";
const browser = await chromium.launch();
const page = await browser.newPage();
const links = new Set();

for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  for (const href of await page.locator("a[href]").evaluateAll(items => items.map(item => item.href))) links.add(href);
}

const results = [];
for (const href of [...links].sort()) {
  const url = new URL(href);
  if (url.protocol === "mailto:" || url.hash) {
    results.push({ href, result: "explicit navigation" });
    continue;
  }
  const response = await fetch(href, { method: "HEAD", redirect: "manual" });
  results.push({ href, status: response.status, location: response.headers.get("location") });
}

await browser.close();
const checkoutLinks = results.filter(item => item.href.includes("/api/v1/products/clipboard-lan-bridge/checkout"));
const failures = results.filter(item => "status" in item && (item.status < 200 || item.status >= 400));
const report = { checked_at: new Date().toISOString(), total: results.length, checkout_links: checkoutLinks, failures, results };
fs.writeFileSync(new URL("link-qa.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(`links ${failures.length === 0 && checkoutLinks.length === 0 ? "PASS" : "FAIL"}: ${results.length} checked`);
if (failures.length || checkoutLinks.length) process.exit(1);
