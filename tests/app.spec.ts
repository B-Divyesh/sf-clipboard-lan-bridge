import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("desktop interface has an accessible empty and offline state", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:1420/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText("No paired destination yet")).toBeVisible();
  await expect(page.locator("#network-state")).toContainText("Open the installed app");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ["serious", "critical"].includes(v.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
});

test("desktop interface remains usable at phone width", async ({ page }) => {
  await page.goto("http://127.0.0.1:1420/#devices");
  await expect(page.getByRole("heading", { name: "Nearby devices" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("link", { name: /Route pass/ }).click();
  await expect(page.getByRole("heading", { name: "Route pass" })).toBeVisible();
});
