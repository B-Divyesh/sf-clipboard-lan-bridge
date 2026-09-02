import { expect, test } from "@playwright/test";

test("@claim:paid-unlock @claim:merchant-refund-terms links the $9 purchase, saves a returned license, and names the refund route", async ({ page }) => {
  await page.route("https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?license=fixture-license-token", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) }));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Buy the $9 license" })).toHaveAttribute("href", "https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout");
  await expect(page.getByRole("heading", { name: "No paired-device limit" })).toBeVisible();

  await page.goto("http://127.0.0.1:1420/#devices");
  await page.locator("summary", { hasText: "Existing license" }).click();
  await expect(page.getByRole("link", { name: "Buy a $9 license" })).toHaveAttribute("href", "https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout");

  await page.goto("http://127.0.0.1:4173/?license=fixture-license-token");
  await expect(page.getByRole("heading", { name: "Finish on your desktop app" })).toBeVisible();
  await expect(page.getByLabel("License token")).toHaveValue("fixture-license-token");
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => ({ token: localStorage.getItem("sb_license:clipboard-lan-bridge"), verdict: JSON.parse(localStorage.getItem("sb_license_verdict:clipboard-lan-bridge") || "{}") }))).toEqual({ token: "fixture-license-token", verdict: expect.objectContaining({ valid: true, reason: "ok" }) });

  await page.goto("http://127.0.0.1:4173/terms/");
  await expect(page.getByText("Sociobot is the merchant of record. Checkout shows the refund terms for your purchase.")).toBeVisible();
});
