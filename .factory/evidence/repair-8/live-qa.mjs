import fs from "node:fs";
import { chromium, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "https://clipboard-lan-bridge.sociobot.in";
const browser = await chromium.launch();
const results = [];

function check(name, pass, evidence) {
  results.push({ name, pass, evidence });
  if (!pass) throw new Error(`${name}: ${JSON.stringify(evidence)}`);
}

for (const [name, options] of [
  ["desktop", { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }],
  ["mobile-390", { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }]
]) {
  const context = await browser.newContext({ ...options, bypassCSP: true });
  const page = await context.newPage();
  const errors = [];
  const origins = new Set();
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => origins.add(new URL(request.url()).origin));

  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
    check(`${name} ${route} status`, response?.status() === 200, response?.status());
    check(`${name} ${route} semantics`, await page.locator("h1").count() === 1 && await page.locator("main").count() === 1, await page.title());
    check(`${name} ${route} no horizontal overflow`, !await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]));
    const undersized = await page.locator("a:visible, button:visible, summary:visible").evaluateAll(elements => elements
      .filter(element => element.getBoundingClientRect().width < 44 || element.getBoundingClientRect().height < 44)
      .map(element => ({ text: (element.textContent || "").trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    check(`${name} ${route} 44px targets`, undersized.length === 0, undersized);
    check(`${name} ${route} Axe`, violations.length === 0, violations.map(item => item.id));
  }

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check(`${name} keyboard skip link`, await page.evaluate(() => document.activeElement?.matches(".skip-link")), await page.evaluate(() => document.activeElement?.textContent));
  check(`${name} reduced motion`, await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior) === "auto", await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior));
  check(`${name} checkout gated`, await page.locator('a[href*="/checkout"], form[action*="/checkout"]').count() === 0 && await page.getByText("Purchases are currently unavailable. Existing license holders can still restore a token in the desktop app.").isVisible(), "no checkout action");
  check(`${name} v0.1.9 download`, /v0\.1\.9/.test(await page.locator("#main-download").getAttribute("href") || ""), await page.locator("#main-download").getAttribute("href"));
  if (name === "mobile-390") {
    await page.addStyleTag({ content: "html{font-size:200%!important}" });
    check("mobile-390 200% text reflow", !await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]));
  }

  await page.goto(`${base}/?demo=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send sample text" }).click();
  const storage = await page.evaluate(() => ({ demo: sessionStorage.getItem("demo:clipboard-lan-bridge:tickets"), real: localStorage.getItem("clipboard-lan-bridge:tickets") }));
  check(`${name} demo isolation`, Boolean(storage.demo) && storage.real === null, storage);
  check(`${name} same-origin requests`, [...origins].every(origin => origin === base), [...origins]);
  check(`${name} no console errors`, errors.length === 0, errors);
  await context.close();
}

for (const selection of [
  { name: "Linux", userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36", suffix: ".AppImage" },
  { name: "Windows", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36", suffix: ".msi" },
  { name: "macOS", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36", suffix: ".dmg" }
]) {
  const context = await browser.newContext({ userAgent: selection.userAgent });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const href = await page.locator("#main-download").getAttribute("href") || "";
  check(`${selection.name} package selection`, href.includes("/v0.1.9/") && href.endsWith(selection.suffix), href);
  await context.close();
}

const returnContext = await browser.newContext();
const returnPage = await returnContext.newPage();
await returnPage.goto(`${base}/?license=repair-8-existing-token`, { waitUntil: "networkidle" });
check("existing-token return", !returnPage.url().includes("license=") && await returnPage.getByLabel("License token").inputValue() === "repair-8-existing-token", returnPage.url());
await returnContext.close();

const offlineContext = await browser.newContext({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
const offlineErrors = [];
offlinePage.on("console", message => { if (message.type() === "error") offlineErrors.push(message.text()); });
offlinePage.on("pageerror", error => offlineErrors.push(error.message));
await offlinePage.goto(`${base}/demo/`, { waitUntil: "networkidle" });
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
if (!await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller))) await offlinePage.reload();
await offlinePage.evaluate(async () => { await caches.open("clipboard-lan-bridge-old-repair-8"); await (await navigator.serviceWorker.getRegistration())?.unregister(); });
await offlinePage.reload({ waitUntil: "networkidle" });
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
const cacheState = await offlinePage.evaluate(async () => ({ caches: await caches.keys(), controlled: Boolean(navigator.serviceWorker.controller) }));
check("live cache replacement", cacheState.controlled && cacheState.caches.length === 1 && cacheState.caches[0] === "clipboard-lan-bridge-v8", cacheState);
await offlineContext.setOffline(true);
await offlinePage.reload();
check("live offline demo reload", await offlinePage.getByText("Demo — sample data, nothing is saved").isVisible() && offlineErrors.length === 0, offlineErrors);
await offlineContext.close();

await browser.close();
fs.writeFileSync(new URL("live-qa.json", import.meta.url), `${JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 2)}\n`);
console.log(`PASS: ${results.length} live checks`);
