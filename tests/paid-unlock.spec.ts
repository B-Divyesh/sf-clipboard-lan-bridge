import { expect, test } from "@playwright/test";

test("@claim:paid-unlock keeps unavailable checkout gated and preserves existing-token restore", async ({ page }) => {
  const checkoutRequests: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/v1/products/clipboard-lan-bridge/checkout")) checkoutRequests.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByText("Purchases are currently unavailable. Existing license holders can still restore a token in the desktop app.")).toBeVisible();
  await expect(page.locator('a[href*="/checkout"], form[action*="/checkout"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy.*license/i })).toHaveCount(0);
  expect(checkoutRequests).toEqual([]);

  await page.goto("http://127.0.0.1:1420/#devices");
  await page.locator("summary", { hasText: "Existing license" }).click();
  await expect(page.getByText("Purchases are currently unavailable. Paste an existing token below.")).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);

  await page.goto("http://127.0.0.1:4173/?license=fixture-license-token");
  await expect(page.getByRole("heading", { name: "Finish on your desktop app" })).toBeVisible();
  await expect(page.getByLabel("License token")).toHaveValue("fixture-license-token");
  await expect(page).toHaveURL(/\/$/);
});
