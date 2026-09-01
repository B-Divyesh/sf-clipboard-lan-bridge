import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "https://clipboard-lan-bridge.sociobot.in";
const checks = [];
const observations = {};
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const browser = await chromium.launch();
for (const profile of [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
]) {
  const context = await browser.newContext({ viewport: profile.viewport, isMobile: profile.isMobile, hasTouch: profile.hasTouch });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));
  for (const route of ["/", "/demo/", "/privacy/", "/terms/"]) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
    const semantic = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
      missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      undersized: [...document.querySelectorAll("a,button,summary")].filter(element => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      }).map(element => ({ text: element.textContent?.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
    }));
    check(`${profile.name} ${route} status`, response?.status() === 200, response?.status());
    check(`${profile.name} ${route} semantics`, semantic.lang === "en" && semantic.h1 === 1 && semantic.main === 1 && semantic.missingAlt === 0, semantic);
    check(`${profile.name} ${route} no overflow`, !semantic.overflow, semantic.overflow);
    check(`${profile.name} ${route} 44px targets`, semantic.undersized.length === 0, semantic.undersized);
    check(`${profile.name} ${route} axe serious/critical`, severe.length === 0, severe.map(item => ({ id: item.id, impact: item.impact })));
  }
  check(`${profile.name} no console errors`, consoleErrors.length === 0, consoleErrors);
  check(`${profile.name} no page errors`, pageErrors.length === 0, pageErrors);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.factory/evidence/verification-3/live-${profile.name}.png`, fullPage: true });
  if (profile.name === "mobile") {
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const largeText = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, clipped: [...document.querySelectorAll("body *")].filter(element => { const r = element.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 || r.left < -1; }).map(element => element.tagName + ":" + (element.textContent || "").trim().slice(0, 40)) }));
    check("mobile 200% text reflow", !largeText.overflow && largeText.clipped.length === 0, largeText);
  }
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto(`${base}/verification-3-not-found`, { waitUntil: "networkidle" });
  const severe = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
  check("designed 404 response", response?.status() === 404 && await page.getByRole("heading", { name: "This page does not exist" }).isVisible(), response?.status());
  check("404 axe serious/critical", severe.length === 0, severe.map(item => ({ id: item.id, impact: item.impact })));
  await context.close();
}

for (const selection of [
  { name: "linux", userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/145 Safari/537.36", suffix: ".AppImage" },
  { name: "windows", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145 Safari/537.36", suffix: ".msi" },
  { name: "macos", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/145 Safari/537.36", suffix: ".dmg" },
]) {
  const context = await browser.newContext({ userAgent: selection.userAgent });
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const download = await page.locator("#main-download").evaluate(anchor => ({ text: anchor.textContent, href: anchor.href }));
  check(`${selection.name} live package selection`, download.text?.includes("v0.1.4") && download.href.endsWith(selection.suffix), download);
  check(`${selection.name} package selection no console errors`, errors.length === 0, errors);
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async value => { copied = value; } } });
    Object.defineProperty(window, "qaCopiedLicense", { get: () => copied });
  });
  await page.goto(`${base}/?license=qa-live-license`, { waitUntil: "networkidle" });
  check("live license URL cleanup and storage", !page.url().includes("license=") && await page.evaluate(() => localStorage.getItem("sb_license:clipboard-lan-bridge")) === "qa-live-license", page.url());
  await page.getByRole("button", { name: "Copy license" }).click();
  check("live license copy feedback", await page.getByRole("button", { name: "License copied" }).isVisible() && await page.evaluate(() => window.qaCopiedLicense) === "qa-live-license", await page.locator("#license-feedback").textContent());
  check("live license flow no page errors", errors.length === 0, errors);
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const requests = [];
  const failures = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", request => requests.push(request.url()));
  page.on("requestfailed", request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));
  const rootResponse = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const first = await page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim(),
    description: document.querySelector(".hero-copy > p")?.textContent?.trim(),
    action: [...document.querySelectorAll("a")].find(a => a.textContent?.includes("Try it with sample data"))?.textContent?.trim(),
    actionVisible: (() => { const a = [...document.querySelectorAll("a")].find(x => x.textContent?.includes("Try it with sample data")); if (!a) return false; const r = a.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()
  }));
  check("first-read plain job, audience/situation, action", first.h1 === "Send text to nearby devices" && Boolean(first.description?.includes("phone and computers")) && first.action === "Try it with sample data" && first.actionVisible, first);
  const demoRequestStart = requests.length;
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForLoadState("networkidle");
  check("one-click demo route", page.url() === `${base}/demo/`, page.url());
  check("demo banner", await page.getByText("Demo — sample data, nothing is saved").isVisible(), "banner visible");
  check("realistic samples", await page.getByText("Groceries: oat milk, coriander, and AA batteries.").isVisible() && await page.getByText("Two sample devices paired").isVisible() && await page.getByText("Kitchen phone").first().isVisible(), "paired-device state, named destination, and grocery item visible");
  const field = page.getByLabel("Text or link");
  await field.fill("   ");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("blank input recovery", await page.getByRole("alert").textContent() === "Enter or paste something to send." && await field.evaluate(el => el === document.activeElement), await page.getByRole("alert").textContent());
  await field.fill("a".repeat(32768));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("32768-byte boundary accepted", await page.locator(".ticket").filter({ hasText: "a".repeat(64) }).count() > 0, "ticket created");
  await field.fill("a".repeat(32769));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("32769-byte boundary rejected", await page.getByRole("alert").textContent() === "Text must be 32 KB or less.", await page.getByRole("alert").textContent());
  await field.fill("🚂".repeat(8193));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("multibyte boundary rejected", await page.getByRole("alert").textContent() === "Text must be 32 KB or less.", await page.getByRole("alert").textContent());
  await field.fill('<img id="qa-injected" src=x onerror="window.qaInjected=true">');
  await page.getByLabel("Expires after").selectOption("120");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("markup-like text rendered as text", await page.locator("#qa-injected").count() === 0 && await page.getByText(/<img id="qa-injected"/).isVisible(), "no injected element");
  check("two-minute expiry applied", (await page.locator(".ticket").first().textContent())?.includes("2m left"), await page.locator(".ticket").first().textContent());
  await page.getByRole("button", { name: "Copy sample text" }).first().click();
  await page.getByRole("button", { name: /Sample text copied|Select the text above/ }).waitFor();
  const copyLabel = await page.locator(".ticket").first().getByRole("button").textContent();
  check("copy feedback", copyLabel === "Sample text copied", copyLabel);
  const storage = await page.evaluate(() => ({ session: Object.keys(sessionStorage), local: Object.keys(localStorage), real: localStorage.getItem("clipboard-lan-bridge:tickets") }));
  check("demo storage isolated", storage.session.every(key => key.startsWith("demo:")) && storage.real === null, storage);
  const demoOnlyOrigins = [...new Set(requests.slice(demoRequestStart).map(url => new URL(url).origin))];
  check("demo-only outgoing requests are same-origin", demoOnlyOrigins.every(origin => origin === base), demoOnlyOrigins);
  await page.screenshot({ path: ".factory/evidence/verification-3/live-demo-mobile.png", fullPage: true });
  await page.getByRole("link", { name: "Start for real" }).click();
  check("demo state discarded", await page.evaluate(() => sessionStorage.getItem("demo:clipboard-lan-bridge:tickets")) === null, "demo key absent");
  const origins = [...new Set(requests.map(url => new URL(url).origin))];
  check("demo exit outgoing requests stay documented", origins.every(origin => [base, "https://api.github.com"].includes(origin)), origins);
  check("demo no failed requests", failures.length === 0, failures);
  check("demo no console errors", consoleErrors.length === 0, consoleErrors);
  check("demo no page errors", pageErrors.length === 0, pageErrors);
  observations.rootHeaders = rootResponse?.headers();
  observations.requestOrigins = origins;
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outline, shadow: getComputedStyle(document.activeElement).boxShadow }));
  check("keyboard skip link first", firstFocus.text === "Skip to main content", firstFocus);
  check("visible focus style", firstFocus.outline !== "none" || firstFocus.shadow !== "none", firstFocus);
  await page.keyboard.press("Enter");
  check("skip link moves focus", await page.evaluate(() => document.activeElement?.id === "main"), await page.evaluate(() => document.activeElement?.id));
  const motion = await page.evaluate(() => ({ smooth: getComputedStyle(document.documentElement).scrollBehavior, running: document.getAnimations().filter(animation => animation.playState === "running").length }));
  check("reduced motion", motion.smooth === "auto" && motion.running === 0, motion);
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  const currentRegistration = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await caches.open("clipboard-lan-bridge-old-verification");
    return registration.unregister();
  });
  check("service worker unregister for update check", currentRegistration, currentRegistration);
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  const cacheNames = await page.evaluate(() => caches.keys());
  check("service worker update clears old cache", !cacheNames.includes("clipboard-lan-bridge-old-verification") && cacheNames.includes("clipboard-lan-bridge-v4"), cacheNames);
  await context.setOffline(true);
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  check("offline reload from service worker", response !== null && await page.getByText("Demo — sample data, nothing is saved").isVisible(), { status: response?.status(), cacheNames });
  check("offline reload no console errors", errors.length === 0, errors);
  observations.cacheNames = cacheNames;
  await context.close();
}

await browser.close();
const failed = checks.filter(item => !item.pass);
console.log(JSON.stringify({ summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length }, failed, checks, observations }, null, 2));
process.exitCode = failed.length ? 1 : 0;
