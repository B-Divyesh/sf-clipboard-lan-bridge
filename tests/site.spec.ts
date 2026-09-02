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
  const offOriginRequests: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") offOriginRequests.push(request.url());
  });
  await page.goto("/");
  const download = page.locator("#main-download");
  if (await download.textContent() === "Downloads are being published") {
    await expect(page.locator("#main-download")).toHaveText("Downloads are being published");
    await expect(page.locator("#main-download")).toHaveAttribute("href", "https://github.com/B-Divyesh/sf-clipboard-lan-bridge/releases/latest");
  } else {
    await expect(download).toHaveText(/^Download v\d+\.\d+\.\d+ for Linux$/);
    await expect(download).toHaveAttribute("href", /releases\/download\/v\d+\.\d+\.\d+\/.*\.AppImage$/);
  }
  expect(offOriginRequests).toEqual([]);
  await context.close();
});

test("@claim:public-page-network-boundary cold public routes do not request GitHub or emit HTTP errors", async ({ page }) => {
  const githubRequests: string[] = [];
  const failedResponses: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  await page.route("https://api.github.com/**", route => {
    githubRequests.push(route.request().url());
    return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "API rate limit exceeded" }) });
  });
  page.on("response", response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => pageErrors.push(error.message));

  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/404.html"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }

  expect(githubRequests).toEqual([]);
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("@claim:sample-demo loads, sends, resets, and isolates realistic sample data", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByText("Groceries: oat milk, coriander, and AA batteries.")).toBeVisible();
  await page.getByLabel("Text or link").fill("Gate changed to 8. Share this with the laptop.");
  await page.getByLabel("Expires after").selectOption("120");
  await page.getByRole("button", { name: "Send sample text" }).click();
  await page.getByLabel("Text or link").fill("");
  await page.getByRole("button", { name: "Send sample text" }).click();
  await expect(page.getByRole("alert")).toHaveText("Enter or paste something to send.");
  await page.getByLabel("Text or link").fill("Gate changed to 8. Share this with the laptop.");
  await page.getByRole("button", { name: "Send sample text" }).click();
  const sentTicket = page.locator(".ticket").filter({ hasText: "Gate changed to 8. Share this with the laptop." });
  await expect(sentTicket.first()).toBeVisible();
  expect(await page.evaluate(() => ({ demo: sessionStorage.getItem("demo:clipboard-lan-bridge:tickets"), real: localStorage.getItem("clipboard-lan-bridge:tickets") }))).toEqual(expect.objectContaining({ real: null }));
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(sentTicket).toHaveCount(0);
  await expect(page.getByLabel("Text or link")).toHaveValue("Meet at Platform 4 at 18:20. The booking link is https://rail.example/BD7Q");
  await expect(page.getByLabel("Expires after")).toHaveValue("600");
  await expect(page.getByRole("alert")).toBeEmpty();
  await page.getByLabel("Text or link").fill("Should be discarded when leaving the demo.");
  await page.getByRole("button", { name: "Send sample text" }).click();
  await page.getByRole("link", { name: "Download the desktop app" }).click();
  await expect(page).toHaveURL(/\/#download$/);
  await expect(page.getByRole("heading", { name: "Install the desktop app" })).toBeFocused();
  expect(await page.evaluate(() => sessionStorage.getItem("demo:clipboard-lan-bridge:tickets"))).toBeNull();
  await page.goto("/demo/");
  await expect(page.getByText("Should be discarded when leaving the demo.")).toHaveCount(0);
});

test("@claim:text-32kb enforces the UTF-8 transfer limit", async ({ page }) => {
  await page.goto("/demo/");
  const input = page.getByLabel("Text or link");
  await input.fill("a".repeat(32_768));
  await page.getByRole("button", { name: "Send sample text" }).click();
  await expect(page.locator(".ticket").filter({ hasText: "a".repeat(80) })).toBeVisible();
  await input.fill("a".repeat(32_769));
  await page.getByRole("button", { name: "Send sample text" }).click();
  await expect(page.getByRole("alert")).toHaveText("Text must be 32 KB or less.");
  await input.fill("🚂".repeat(8193));
  await page.getByRole("button", { name: "Send sample text" }).click();
  await expect(page.getByRole("alert")).toHaveText("Text must be 32 KB or less.");
});

test("@claim:expiry offers and applies two and ten minute expiry", async ({ page }) => {
  await page.addInitScript(() => { (window as Window & { __clipboardDemoNow?: number }).__clipboardDemoNow = 1_000_000; });
  await page.goto("/demo/");
  for (const [seconds, text] of [[120, "Two minute sample"], [600, "Ten minute sample"]] as const) {
    const start = await page.evaluate(() => Number(sessionStorage.getItem("demo:clipboard-lan-bridge:now")) || (window as Window & { __clipboardDemoNow?: number }).__clipboardDemoNow!);
    await page.getByLabel("Expires after").selectOption(String(seconds));
    await page.getByLabel("Text or link").fill(text);
    await page.getByRole("button", { name: "Send sample text" }).click();
    await expect(page.locator(".ticket").filter({ hasText: text })).toBeVisible();
    await page.evaluate(value => sessionStorage.setItem("demo:clipboard-lan-bridge:now", String(value)), start + seconds * 1000 - 1);
    await page.reload();
    await expect(page.locator(".ticket").filter({ hasText: text })).toBeVisible();
    await page.evaluate(value => sessionStorage.setItem("demo:clipboard-lan-bridge:now", String(value)), start + seconds * 1000 + 1);
    await page.reload();
    await expect(page.locator(".ticket").filter({ hasText: text })).toHaveCount(0);
  }
});

test("@claim:no-telemetry keeps the complete demo flow on the product origin", async ({ page }) => {
  const origins = new Set<string>();
  page.on("request", request => origins.add(new URL(request.url()).origin));
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Send sample text" }).click();
  await page.goto("http://127.0.0.1:1420/");
  expect([...origins].every(origin => ["http://127.0.0.1:4173", "http://127.0.0.1:1420"].includes(origin))).toBe(true);
});

test("@claim:no-account runs the sample handoff without sign-in", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Send sample text" }).click();
  await expect(page.locator(".ticket").first()).toBeVisible();
});

test("@claim:unsigned-packages warns plainly about unsigned packages", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#platform-note")).toContainText("unverified-publisher warning");
  await expect(page.locator("#download").getByText("Your operating system may show an unverified-publisher warning.")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toContain("community build");
  expect(await page.locator("body").innerText()).not.toContain("not code-signed");
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
  await expect(page.getByText("Keep the phone page open until the transfer arrives.")).toBeVisible();
});

test("internal navigation and browser Back move focus to the new page heading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(page.locator("h1")).toBeFocused();
  await page.goBack();
  await expect(page.locator("h1")).toBeFocused();
});

test("primary demo navigation and Back move focus to the route heading", async ({ page }, testInfo) => {
  await page.setViewportSize(testInfo.project.name.includes("mobile") ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.locator("h1")).toBeFocused();
  await page.goBack();
  await expect(page.locator("h1")).toBeFocused();
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
  await page.evaluate(async () => { await caches.open("clipboard-lan-bridge-old-test"); await (await navigator.serviceWorker.getRegistration())?.unregister(); });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(async () => ({ caches: await caches.keys(), controlled: Boolean(navigator.serviceWorker.controller) }))).toEqual({ caches: ["clipboard-lan-bridge-v10"], controlled: true });
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
