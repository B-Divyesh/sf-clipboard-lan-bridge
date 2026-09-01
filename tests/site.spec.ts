import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const serious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) => results.violations.filter(v => ["serious", "critical"].includes(v.impact || ""));

test("landing and legal routes meet the accessibility baseline", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
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

test("@claim:platform-download selects the current package for this operating system", async ({ browser }) => {
  const context = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36" });
  const page = await context.newPage();
  await page.route("https://api.github.com/repos/B-Divyesh/sf-clipboard-lan-bridge/releases?per_page=1", route => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ tag_name: "v9.8.7", assets: [
      { name: "latest.json", browser_download_url: "https://downloads.example/latest.json" },
      { name: "linux-x86_64-Clipboard.LAN.Bridge.AppImage", browser_download_url: "https://downloads.example/bridge.AppImage" },
      { name: "windows-x86_64-Clipboard.LAN.Bridge.msi", browser_download_url: "https://downloads.example/bridge.msi" }
    ] }])
  }));
  await page.goto("/");
  await expect(page.locator("#main-download")).toHaveText("Download v9.8.7 for Linux");
  await expect(page.locator("#main-download")).toHaveAttribute("href", "https://downloads.example/bridge.AppImage");
  await context.close();
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
  await page.getByLabel("Text or link").fill("Should be discarded when leaving the demo.");
  await page.getByRole("button", { name: "Send sample ticket" }).click();
  await page.getByRole("link", { name: "Start for real" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => sessionStorage.getItem("demo:clipboard-lan-bridge:tickets"))).toBeNull();
  await page.goto("/demo/");
  await expect(page.getByText("Should be discarded when leaving the demo.")).toHaveCount(0);
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
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (value: string) => { copied = value; } } });
    Object.defineProperty(window, "returnedLicenseClipboard", { get: () => copied });
  });
  await page.goto("/?license=qa-fixture-license");
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByRole("heading", { name: "Move your pass into the app" })).toBeVisible();
  await expect(page.locator("#returned-license")).toHaveText("qa-fixture-license");
  expect(await page.evaluate(() => localStorage.getItem("sb_license:clipboard-lan-bridge"))).toBe("qa-fixture-license");
  await page.getByRole("button", { name: "Copy license" }).click();
  await page.waitForTimeout(25);
  expect(errors).toEqual([]);
  await expect(page.getByRole("button", { name: "License copied" })).toBeVisible();
  await expect(page.locator("#license-feedback")).toContainText("License copied. Paste it in the desktop app");
  expect(await page.evaluate(() => (window as unknown as { returnedLicenseClipboard: string }).returnedLicenseClipboard)).toBe("qa-fixture-license");
});

test("@claim:checkout-status does not advertise an operator-gated checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Checkout is temporarily unavailable. If you already have a license, paste it in the desktop app.")).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test("links and controls retain 44px targets in both dimensions and the hero heading keeps devices whole", async ({ page }, testInfo) => {
  const viewport = testInfo.project.name.includes("mobile") ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
    await page.goto(route);
    const undersized = await page.locator("a:visible, button:visible, summary:visible").evaluateAll(elements => elements
      .filter(element => element.getBoundingClientRect().width < 44 || element.getBoundingClientRect().height < 44)
      .map(element => ({ name: (element.textContent || "").trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    expect(undersized).toEqual([]);
  }
  await page.goto("/");
  const headingLines = await page.locator("h1").evaluate(element => {
    const lines = new Map<number, string>();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      for (let index = 0; index < (node.textContent || "").length; index += 1) {
        const range = document.createRange();
        range.setStart(node, index); range.setEnd(node, index + 1);
        const rect = range.getBoundingClientRect();
        const top = Math.round(rect.top);
        lines.set(top, `${lines.get(top) || ""}${node.textContent?.[index] || ""}`);
      }
    }
    return [...lines.entries()].sort(([a], [b]) => a - b).map(([, text]) => text.trim()).filter(Boolean);
  });
  expect(headingLines).not.toContain("S");
  expect(headingLines.join(" ")).toContain("devices");
});

test("skip links move keyboard focus into main content", async ({ page }) => {
  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
    await page.goto(route);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  }
});

test("secondary routes share the site frame, metadata, and clear phone-background guidance", async ({ page }) => {
  for (const [route, title, canonical] of [
    ["/demo/", "Demo — Clipboard LAN Bridge", "https://clipboard-lan-bridge.sociobot.in/demo/"],
    ["/privacy/", "Privacy — Clipboard LAN Bridge", "https://clipboard-lan-bridge.sociobot.in/privacy/"],
    ["/terms/", "Terms — Clipboard LAN Bridge", "https://clipboard-lan-bridge.sociobot.in/terms/"],
    ["/404.html", "Page not found — Clipboard LAN Bridge", "https://clipboard-lan-bridge.sociobot.in/404.html"]
  ]) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /social-card\.webp/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator("header.site-header .wordmark")).toBeVisible();
    await expect(page.locator("header.site-header nav")).toContainText("Demo");
    await expect(page.locator("footer.site-footer")).toContainText("Built by Param Factory");
    await expect(page.locator("footer.site-footer").getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(page.locator("footer.site-footer").getByRole("link", { name: "Terms" })).toBeVisible();
  }
  await page.goto("/");
  await expect(page.getByText("Keep that page open: phone browsers may pause background polling.")).toBeVisible();
});

test("offline reload uses the cached shell without console errors", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto("http://127.0.0.1:4173/demo/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  expect(requests.some(path => path.startsWith("/B-Divyesh/"))).toBe(false);
  expect(requests.some(path => path.startsWith("/api/v1/products/"))).toBe(false);
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
