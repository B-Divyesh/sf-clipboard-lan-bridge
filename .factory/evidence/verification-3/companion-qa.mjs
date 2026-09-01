import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const requests = [];
const consoleErrors = [];
const pageErrors = [];
page.on("request", request => requests.push(request.url()));
page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", error => pageErrors.push(error.message));
const response = await page.goto("http://127.0.0.1:38743/", { waitUntil: "networkidle" });
const axe = await new AxeBuilder({ page }).analyze();
const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
const semantic = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  title: document.title,
  h1: document.querySelectorAll("h1").length,
  main: document.querySelectorAll("main").length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
}));
await page.getByLabel("Phone name").fill("A");
await page.getByRole("button", { name: "Show pairing code" }).click();
const invalidMessage = await page.getByRole("alert").textContent();
await page.getByLabel("Phone name").fill("QA phone");
await page.getByRole("button", { name: "Show pairing code" }).click();
const code = await page.locator("#pair-code strong").textContent();
const result = {
  status: response?.status(),
  semantic,
  axeSeriousCritical: severe.map(item => ({ id: item.id, impact: item.impact })),
  invalidMessage,
  code,
  codeLength: code?.length,
  requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
  consoleErrors,
  pageErrors,
};
console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: ".factory/evidence/verification-3/companion-mobile.png", fullPage: true });
await context.close();
await browser.close();
process.exitCode = response?.status() === 200 && semantic.lang === "en" && semantic.h1 === 1 && semantic.main === 1 && !semantic.overflow && severe.length === 0 && invalidMessage === "Use a valid phone name and identity." && code?.length === 6 && result.requestOrigins.every(origin => origin === "http://127.0.0.1:38743") && consoleErrors.length === 0 && pageErrors.length === 0 ? 0 : 1;
