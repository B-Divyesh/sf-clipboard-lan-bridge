import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const emptySnapshot = { device_id: "browser-preview", device_name: "This device", network_ready: false, network_error: "Open the installed app to discover devices on your LAN.", peers: [], pairings: [], inbox: [], sent: [], licensed: false, license_reason: "not_checked", companion_urls: [] };

test("desktop interface has accessible empty, phone, and pass states", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:1420/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText("No paired destination yet")).toBeVisible();
  await page.getByRole("link", { name: "Devices" }).click();
  await expect(page.getByRole("heading", { name: "Connect a phone" })).toBeVisible();
  await page.getByRole("link", { name: /Route pass/ }).click();
  expect((await new AxeBuilder({ page: page as never }).analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
});

test("@claim:native-license-verification uses native verification, not writable local storage", async ({ page }) => {
  await page.addInitScript(snapshot => {
    let licensed = false;
    localStorage.setItem("sb_license_verdict:clipboard-lan-bridge", JSON.stringify({ valid: true }));
    Object.defineProperty(window, "__TAURI_INTERNALS__", { value: { invoke: async (command: string) => {
      if (command === "get_snapshot") return { ...snapshot, licensed };
      if (command === "verify_license") { licensed = true; return { valid: true, reason: "ok" }; }
      return null;
    } } });
  }, emptySnapshot);
  await page.goto("http://127.0.0.1:1420/#pass");
  expect(await page.locator('option[value="3600"]').evaluate(option => (option as HTMLOptionElement).disabled)).toBe(true);
  await page.getByLabel("Have a license? Paste it here").fill("fixture-license-token");
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.getByText("Route pass restored on this device.")).toBeVisible();
  expect(await page.locator('option[value="3600"]').evaluate(option => (option as HTMLOptionElement).disabled)).toBe(false);
});

test("interface reflows at 390px with large text", async ({ page }) => {
  await page.goto("http://127.0.0.1:1420/#devices");
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
});

test("@claim:no-clipboard-monitoring reads the clipboard only after the paste action", async ({ page }) => {
  await page.addInitScript(() => {
    let reads = 0;
    Object.defineProperty(navigator, "clipboard", { value: { readText: async () => { reads += 1; return "sample clipboard"; }, writeText: async () => undefined } });
    Object.defineProperty(window, "clipboardReadCount", { get: () => reads });
  });
  await page.goto("http://127.0.0.1:1420/");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { clipboardReadCount: number }).clipboardReadCount)).toBe(0);
  await page.getByRole("button", { name: "Paste from clipboard" }).click();
  expect(await page.evaluate(() => (window as unknown as { clipboardReadCount: number }).clipboardReadCount)).toBe(1);
});

test("a received native ticket can be copied deliberately", async ({ page }) => {
  await page.addInitScript(snapshot => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", { value: { readText: async () => "", writeText: async (value: string) => { copied = value; } } });
    Object.defineProperty(window, "copiedText", { get: () => copied });
    Object.defineProperty(window, "__TAURI_INTERNALS__", { value: { invoke: async (command: string) => command === "get_snapshot" ? snapshot : null } });
  }, { ...emptySnapshot, inbox: [{ id: "arrival-1", peer_id: "phone-1", peer_name: "Kitchen phone", text: "Board at platform 4", created_at: Date.now(), expires_at: Date.now() + 120_000, status: "received" }] });
  await page.goto("http://127.0.0.1:1420/#receive");
  await page.getByRole("button", { name: "Copy text" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copiedText: string }).copiedText)).toBe("Board at platform 4");
});
