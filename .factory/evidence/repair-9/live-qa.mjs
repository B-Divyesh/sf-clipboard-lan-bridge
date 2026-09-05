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
  ["phone-390", { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }]
]) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  const ordinaryOrigins = new Set();
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => ordinaryOrigins.add(new URL(request.url()).origin));

  const response = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  check(`${name} root status`, response?.status() === 200, response?.status());
  const heading = (await page.locator("h1").textContent())?.trim();
  check(`${name} job`, heading === "Send text to nearby devices", heading);
  check(`${name} audience`, await page.getByText("Move one link, address, or note between your phone and computers on the same local network.").isVisible(), "audience sentence visible");
  const sampleAction = page.getByRole("link", { name: "Try it with sample data" });
  const actionBox = await sampleAction.boundingBox();
  check(`${name} first action`, Boolean(actionBox && actionBox.y + actionBox.height <= options.viewport.height), actionBox);
  await page.keyboard.press("Tab");
  check(`${name} keyboard skip link`, await page.evaluate(() => document.activeElement?.matches(".skip-link")), await page.evaluate(() => document.activeElement?.textContent));
  await page.screenshot({ path: new URL(`${name}-root.png`, import.meta.url).pathname, fullPage: true });

  await page.evaluate(() => {
    localStorage.setItem("clipboard-lan-bridge:tickets", "real-local-unchanged");
    sessionStorage.setItem("clipboard-lan-bridge:session", "real-session-unchanged");
  });
  await sampleAction.click();
  check(`${name} demo route`, page.url() === `${base}/demo/`, page.url());
  check(`${name} demo label`, await page.getByText("Demo — sample data, nothing is saved").isVisible(), "visible");
  check(`${name} realistic arrival`, await page.getByText("Groceries: oat milk, coriander, and AA batteries.").isVisible(), "visible");
  await page.getByLabel("Text or link").fill("Gate changed to 8. Share this with the laptop.");
  await page.getByRole("button", { name: "Send sample text" }).click();
  check(`${name} populated result`, await page.getByText("Gate changed to 8. Share this with the laptop.").isVisible(), "visible");
  await page.locator("footer").scrollIntoViewIfNeeded();
  check(`${name} persistent demo label`, await page.getByText("Demo — sample data, nothing is saved").isVisible(), "visible after scroll");
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: new URL(`${name}-demo.png`, import.meta.url).pathname, fullPage: true });
  await page.getByRole("button", { name: "Reset demo" }).click();
  check(`${name} reset text`, await page.getByLabel("Text or link").inputValue() === "Meet at Platform 4 at 18:20. The booking link is https://rail.example/BD7Q", await page.getByLabel("Text or link").inputValue());
  check(`${name} reset result`, await page.getByText("Gate changed to 8. Share this with the laptop.").count() === 0, "sent sample removed");
  const storage = await page.evaluate(() => ({
    local: localStorage.getItem("clipboard-lan-bridge:tickets"),
    session: sessionStorage.getItem("clipboard-lan-bridge:session"),
    demo: sessionStorage.getItem("demo:clipboard-lan-bridge:tickets")
  }));
  check(`${name} real data unchanged`, storage.local === "real-local-unchanged" && storage.session === "real-session-unchanged" && Boolean(storage.demo), storage);

  for (const route of ["/", "/demo/", "/privacy/", "/terms/"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
    check(`${name} ${route} semantics`, await page.locator("h1").count() === 1 && await page.locator("main").count() === 1 && await page.locator("html").getAttribute("lang") === "en", await page.title());
    check(`${name} ${route} layout`, !await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]));
    check(`${name} ${route} axe`, violations.length === 0, violations.map(item => item.id));
  }

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  check(`${name} reduced motion`, await page.evaluate(() => [...document.getAnimations()].every(animation => animation.playState === "finished" || animation.effect?.getTiming().duration === 0)), await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior));
  check(`${name} ordinary request boundary`, [...ordinaryOrigins].every(origin => origin === base), [...ordinaryOrigins]);
  check(`${name} no normal-route errors`, errors.length === 0, errors);
  await context.close();
}

const licenseContext = await browser.newContext();
const licensePage = await licenseContext.newPage();
const licenseRequests = [];
const licenseErrors = [];
licensePage.on("request", request => licenseRequests.push({ method: request.method(), url: request.url() }));
licensePage.on("console", message => { if (message.type() === "error") licenseErrors.push(message.text()); });
licensePage.on("pageerror", error => licenseErrors.push(error.message));
await licensePage.goto(`${base}/?license=repair-9-fixture-token`, { waitUntil: "networkidle" });
const externalLicenseRequests = licenseRequests.filter(request => new URL(request.url).origin !== base);
check("license return cleans URL", licensePage.url() === `${base}/`, licensePage.url());
check("license return shows token", await licensePage.getByLabel("License token").inputValue() === "repair-9-fixture-token", "token shown for desktop restore");
check("license return request boundary", externalLicenseRequests.length === 1 && externalLicenseRequests[0].method === "GET" && externalLicenseRequests[0].url === "https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?license=repair-9-fixture-token", externalLicenseRequests);
check("license return no errors", licenseErrors.length === 0, licenseErrors);
await licenseContext.close();

const missingContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const missingPage = await missingContext.newPage();
const missingResponse = await missingPage.goto(`${base}/repair-9-missing`, { waitUntil: "networkidle" });
const missingViolations = (await new AxeBuilder({ page: missingPage }).analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
check("missing route is deliberate 404", missingResponse?.status() === 404, missingResponse?.status());
check("missing route design", await missingPage.getByRole("heading", { name: "This page does not exist" }).isVisible() && missingViolations.length === 0, missingViolations.map(item => item.id));
await missingContext.close();

const offlineContext = await browser.newContext({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
const offlineErrors = [];
offlinePage.on("console", message => { if (message.type() === "error") offlineErrors.push(message.text()); });
offlinePage.on("pageerror", error => offlineErrors.push(error.message));
await offlinePage.goto(`${base}/demo/`, { waitUntil: "networkidle" });
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
if (!await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller))) await offlinePage.reload({ waitUntil: "networkidle" });
await offlineContext.setOffline(true);
await offlinePage.reload();
check("offline demo reload", await offlinePage.getByText("Demo — sample data, nothing is saved").isVisible() && offlineErrors.length === 0, offlineErrors);
await offlineContext.close();

const checkoutResponse = await fetch("https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout", { redirect: "manual" });
results.push({ name: "Sociobot checkout dependency", pass: checkoutResponse.status >= 300 && checkoutResponse.status < 400, evidence: { status: checkoutResponse.status } });

await browser.close();
fs.writeFileSync(new URL("live-qa.json", import.meta.url), `${JSON.stringify({ checked_at: new Date().toISOString(), implementation_commit: "85e17b7", results }, null, 2)}\n`);
console.log(`Completed ${results.length} live checks; checkout status ${checkoutResponse.status}.`);
