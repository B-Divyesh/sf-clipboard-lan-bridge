import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) => results.violations.filter(v => ["serious", "critical"].includes(v.impact || ""));

test("landing and legal routes meet the accessibility baseline", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  for (const route of ["/", "/demo/", "/privacy/", "/terms/"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeVisible();
    expect(serious(await new AxeBuilder({ page: page as never }).analyze())).toEqual([]);
  }
  expect(consoleErrors).toEqual([]);
});

test("the first screen exposes the sample action and does not overflow", async ({ page }, testInfo) => {
  const viewport = testInfo.project.name.includes("mobile") ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await page.goto("/");
  const action = page.getByRole("link", { name: "Try it with sample data" });
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("@claim:sample-demo loads, sends, resets, and isolates realistic sample data", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByText("Groceries: oat milk, coriander, and AA batteries.")).toBeVisible();
  await page.getByLabel("Text or link").fill("Gate changed to 8. Share this with the laptop.");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await expect(page.getByText("Gate changed to 8. Share this with the laptop.")).toBeVisible();
  expect(await page.evaluate(() => ({ demo: sessionStorage.getItem("demo:clipboard-lan-bridge:tickets"), real: localStorage.getItem("clipboard-lan-bridge:tickets") }))).toEqual(expect.objectContaining({ real: null }));
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByText("Gate changed to 8. Share this with the laptop.")).toHaveCount(0);
});

test("@claim:text-32kb enforces the UTF-8 transfer limit", async ({ page }) => {
  await page.goto("/demo/");
  const input = page.getByLabel("Text or link");
  await input.fill("🚂".repeat(8193));
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await expect(page.getByRole("alert")).toHaveText("Text must be 32 KB or less.");
});

test("@claim:expiry offers and applies two and ten minute expiry", async ({ page }) => {
  await page.goto("/demo/");
  await page.getByLabel("Expires after").selectOption("120");
  await page.getByLabel("Text or link").fill("Short-lived sample");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await expect(page.locator(".ticket").filter({ hasText: "Short-lived sample" })).toContainText("2m left");
});

test("@claim:no-telemetry keeps the complete demo flow on the product origin", async ({ page }) => {
  const origins = new Set<string>();
  page.on("request", request => origins.add(new URL(request.url()).origin));
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await page.goto("http://127.0.0.1:1420/");
  expect([...origins].every(origin => ["http://127.0.0.1:4173", "http://127.0.0.1:1420"].includes(origin))).toBe(true);
});

test("@claim:no-account runs the sample handoff without sign-in", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await expect(page.locator(".ticket").first()).toBeVisible();
});

test("@claim:license-handoff exposes a checkout token for the desktop app", async ({ page }) => {
  await page.goto("/?license=qa-fixture-license");
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByRole("heading", { name: "Move your pass into the app" })).toBeVisible();
  await expect(page.locator("#returned-license")).toHaveText("qa-fixture-license");
  expect(await page.evaluate(() => localStorage.getItem("sb_license:clipboard-lan-bridge"))).toBe("qa-fixture-license");
});

test("offline reload uses the cached shell without console errors", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:4173/demo/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("metadata, crawler files, and the production 404 policy are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://clipboard-lan-bridge.sociobot.in/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /social-card\.webp/);
  expect((await page.request.get("/robots.txt")).status()).toBe(200);
  expect((await page.request.get("/sitemap.xml")).status()).toBe(200);
  const config = await (await page.request.get("/staticwebapp.config.json")).json();
  expect(config.globalHeaders["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  expect(config.responseOverrides["404"].rewrite).toBe("/404.html");
});
