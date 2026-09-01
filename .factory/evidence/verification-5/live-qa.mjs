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
  const context = await browser.newContext(profile);
  const page = await context.newPage();
  const requests = [];
  const failures = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", request => requests.push(request.url()));
  page.on("requestfailed", request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));

  for (const route of ["/", "/demo/", "/privacy/", "/terms/"]) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
    const state = await page.evaluate(() => ({
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
      }).map(element => ({ text: (element.textContent || "").trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })),
    }));
    check(`${profile.name} ${route} status`, response?.status() === 200, response?.status());
    check(`${profile.name} ${route} semantics`, state.lang === "en" && state.title.length > 0 && state.h1 === 1 && state.main === 1 && state.missingAlt === 0, state);
    check(`${profile.name} ${route} no overflow`, !state.overflow, state.overflow);
    check(`${profile.name} ${route} 44px targets`, state.undersized.length === 0, state.undersized);
    check(`${profile.name} ${route} axe serious/critical`, severe.length === 0, severe.map(item => ({ id: item.id, impact: item.impact })));
  }

  check(`${profile.name} public routes no console errors`, consoleErrors.length === 0, [...consoleErrors]);
  check(`${profile.name} public routes no page errors`, pageErrors.length === 0, [...pageErrors]);

  const notFound = await page.goto(`${base}/verification-5-not-found`, { waitUntil: "networkidle" });
  const notFoundAxe = (await new AxeBuilder({ page }).analyze()).violations.filter(item => ["serious", "critical"].includes(item.impact || ""));
  check(`${profile.name} designed 404`, notFound?.status() === 404 && await page.getByRole("heading", { name: "This page does not exist" }).isVisible(), notFound?.status());
  check(`${profile.name} 404 axe serious/critical`, notFoundAxe.length === 0, notFoundAxe.map(item => ({ id: item.id, impact: item.impact })));
  consoleErrors.length = 0;
  pageErrors.length = 0;

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.factory/evidence/verification-5/live-${profile.name}.png`, fullPage: true });
  if (profile.name === "mobile") {
    const first = await page.evaluate(() => {
      const action = [...document.querySelectorAll("a")].find(link => link.textContent?.includes("Try it with sample data"));
      const box = action?.getBoundingClientRect();
      return {
        h1: document.querySelector("h1")?.textContent?.trim().replace(/\s+/g, " "),
        description: document.querySelector(".hero-copy > p")?.textContent?.trim().replace(/\s+/g, " "),
        action: action?.textContent?.trim(),
        actionVisible: Boolean(box && box.top >= 0 && box.bottom <= innerHeight),
      };
    });
    check("cold first-read job, audience, and action", first.h1 === "Send text to nearby devices" && Boolean(first.description?.includes("phone and computers on the same local network")) && first.action === "Try it with sample data" && first.actionVisible, first);

    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const reflow = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      clipped: [...document.querySelectorAll("body *")].filter(element => {
        const box = element.getBoundingClientRect();
        return box.right > document.documentElement.clientWidth + 1 || box.left < -1;
      }).map(element => `${element.tagName}:${(element.textContent || "").trim().slice(0, 50)}`),
    }));
    check("mobile 200% text reflow", !reflow.overflow && reflow.clipped.length === 0, reflow);
  }
  const origins = [...new Set(requests.map(url => new URL(url).origin))];
  check(`${profile.name} requests remain same-origin`, origins.every(origin => origin === base), origins);
  check(`${profile.name} no request failures`, failures.length === 0, failures);
  check(`${profile.name} post-404 no console errors`, consoleErrors.length === 0, consoleErrors);
  check(`${profile.name} post-404 no page errors`, pageErrors.length === 0, pageErrors);
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
  const download = await page.locator("#main-download").evaluate(anchor => ({ text: (anchor.textContent || "").trim().replace(/\s+/g, " "), href: anchor.href }));
  check(`${selection.name} v0.1.6 package selection`, download.text.includes("Download") && download.href.includes("/v0.1.6/") && download.href.endsWith(selection.suffix), download);
  check(`${selection.name} package selection no console errors`, errors.length === 0, errors);
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
  await page.addInitScript(() => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async value => { copied = value; }, readText: async () => "" } });
    Object.defineProperty(window, "qaCopied", { get: () => copied });
  });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForLoadState("networkidle");
  check("one-click demo route", page.url() === `${base}/demo/`, page.url());
  check("persistent demo banner", await page.getByText("Demo — sample data, nothing is saved").isVisible(), "visible");
  check("realistic sample devices and content", await page.getByText("Two sample devices paired").isVisible() && await page.getByText("Kitchen phone").first().isVisible() && await page.getByText("Groceries: oat milk, coriander, and AA batteries.").isVisible(), "visible");
  const field = page.getByLabel("Text or link");
  await field.fill("   ");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("blank input recovery", await page.getByRole("alert").textContent() === "Enter or paste something to send." && await field.evaluate(element => element === document.activeElement), await page.getByRole("alert").textContent());
  await field.fill("a".repeat(32768));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("32768-byte boundary accepted", await page.locator(".ticket").filter({ hasText: "a".repeat(64) }).count() > 0, "ticket created");
  await field.fill("🚂".repeat(8193));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("32769-byte Unicode boundary rejected", await page.getByRole("alert").textContent() === "Text must be 32 KB or less.", await page.getByRole("alert").textContent());
  await field.fill('<img id="qa-injected" src=x onerror="window.qaInjected=true">');
  await page.getByLabel("Expires after").selectOption("120");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  check("markup-like input rendered as text", await page.locator("#qa-injected").count() === 0 && await page.getByText(/<img id="qa-injected"/).isVisible(), "no injected element");
  check("two-minute expiry applied", (await page.locator(".ticket").first().textContent())?.includes("2m left"), await page.locator(".ticket").first().textContent());
  await page.locator(".ticket").first().getByRole("button").click();
  check("explicit copy feedback", await page.locator(".ticket").first().getByRole("button").textContent() === "Sample text copied", await page.locator(".ticket").first().getByRole("button").textContent());
  const storage = await page.evaluate(() => ({ session: Object.keys(sessionStorage), local: Object.keys(localStorage), real: localStorage.getItem("clipboard-lan-bridge:tickets") }));
  check("demo storage isolated", storage.session.every(key => key.startsWith("demo:")) && storage.real === null, storage);
  await page.screenshot({ path: ".factory/evidence/verification-5/live-demo-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Reset demo" }).click();
  check("demo reset removes sent input", await page.getByText(/<img id="qa-injected"/).count() === 0, "removed");
  await field.fill("Discard when leaving");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await page.getByRole("link", { name: "Start for real" }).click();
  check("leaving demo discards sample namespace", await page.evaluate(() => sessionStorage.getItem("demo:clipboard-lan-bridge:tickets")) === null, "demo key absent");
  const origins = [...new Set(requests.map(url => new URL(url).origin))];
  check("full demo flow stays same-origin", origins.every(origin => origin === base), origins);
  check("demo no failed requests", failures.length === 0, failures);
  check("demo no console errors", consoleErrors.length === 0, consoleErrors);
  check("demo no page errors", pageErrors.length === 0, pageErrors);
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
  check("license URL cleanup and local handoff", !page.url().includes("license=") && await page.evaluate(() => localStorage.getItem("sb_license:clipboard-lan-bridge")) === "qa-live-license", page.url());
  await page.getByRole("button", { name: "Copy license" }).click();
  check("license copy feedback", await page.getByRole("button", { name: "License copied" }).isVisible() && await page.evaluate(() => window.qaCopiedLicense) === "qa-live-license", await page.locator("#license-feedback").textContent());
  check("license handoff no page errors", errors.length === 0, errors);
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => ({ text: (document.activeElement?.textContent || "").trim(), outline: getComputedStyle(document.activeElement).outline, shadow: getComputedStyle(document.activeElement).boxShadow }));
  check("keyboard skip link is first", firstFocus.text === "Skip to main content", firstFocus);
  check("visible focus style", firstFocus.outline !== "none" || firstFocus.shadow !== "none", firstFocus);
  await page.keyboard.press("Enter");
  check("skip link moves focus to main", await page.evaluate(() => document.activeElement?.id === "main"), await page.evaluate(() => document.activeElement?.id));
  const expectedFocusables = await page.locator("a[href]:visible,button:visible,textarea:visible,select:visible").count();
  const seen = new Set();
  for (let index = 0; index < expectedFocusables + 2; index += 1) {
    await page.keyboard.press("Tab");
    seen.add(await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.id || (document.activeElement?.textContent || "").trim().slice(0, 30)}`));
  }
  check("keyboard reaches all visible controls without trap", seen.size >= expectedFocusables - 1, { expectedFocusables, seen: [...seen] });
  const motion = await page.evaluate(() => ({ smooth: getComputedStyle(document.documentElement).scrollBehavior, running: document.getAnimations().filter(animation => animation.playState === "running").length }));
  check("reduced motion disables smooth and running motion", motion.smooth === "auto" && motion.running === 0, motion);
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const rootResponse = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const scriptPath = await page.locator('script[src*="/assets/main-"]').getAttribute("src");
  const scriptResponse = scriptPath ? await context.request.get(`${base}${scriptPath}`) : null;
  observations.rootHeaders = await rootResponse?.allHeaders();
  observations.scriptHeaders = scriptResponse?.headers();
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  const registration = await page.evaluate(async () => {
    const item = await navigator.serviceWorker.ready;
    return { scope: item.scope, unregistered: await item.unregister() };
  });
  await page.evaluate(() => caches.open("clipboard-lan-bridge-old-verification-5"));
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(250);
  const cacheNames = await page.evaluate(() => caches.keys());
  check("service worker update clears old cache", !cacheNames.includes("clipboard-lan-bridge-old-verification-5") && cacheNames.includes("clipboard-lan-bridge-v7"), cacheNames);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload({ waitUntil: "networkidle" });
  await context.setOffline(true);
  const offlineResponse = await page.reload({ waitUntil: "domcontentloaded" });
  check("offline demo reload", offlineResponse !== null && await page.getByText("Demo — sample data, nothing is saved").isVisible(), { status: offlineResponse?.status(), registration, cacheNames });
  check("offline reload no console errors", errors.length === 0, errors);
  await context.close();
}

await browser.close();
const failed = checks.filter(item => !item.pass);
console.log(JSON.stringify({ summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length }, failed, checks, observations }, null, 2));
process.exitCode = failed.length ? 1 : 0;
