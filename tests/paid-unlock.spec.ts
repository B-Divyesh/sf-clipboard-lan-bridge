import { expect, test } from "@playwright/test";

const checkoutUrl = "https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/checkout";

test("@claim:purchase-unavailable exposes no enabled purchase control to the unavailable checkout", async ({ page, request }) => {
  const checkoutResponse = await request.get(checkoutUrl, { maxRedirects: 0 });

  await page.goto("/");
  await expect(page.getByText("New licenses are not available.")).toBeVisible();
  await expect(page.locator(`a[href="${checkoutUrl}"]`)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|purchase/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /buy|purchase/i })).toHaveCount(0);

  await page.goto("http://127.0.0.1:1420/#devices");
  await page.locator("summary", { hasText: "Existing license" }).click();
  await expect(page.getByText("New licenses are not available. Paste an existing token below.")).toBeVisible();
  await expect(page.locator(`a[href="${checkoutUrl}"]`)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|purchase/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /buy|purchase/i })).toHaveCount(0);

  if (checkoutResponse.status() >= 400) {
    expect(await page.locator(`a[href="${checkoutUrl}"], form[action="${checkoutUrl}"]`).count()).toBe(0);
  }
});

test("@claim:license-recovery saves a returned license for desktop restore", async ({ page }) => {
  await page.route("https://api.sociobot.in/api/v1/products/clipboard-lan-bridge/verify?license=fixture-license-token", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) }));
  await page.goto("http://127.0.0.1:4173/?license=fixture-license-token");
  await expect(page.getByRole("heading", { name: "Finish on your desktop app" })).toBeVisible();
  await expect(page.getByLabel("License token")).toHaveValue("fixture-license-token");
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => ({ token: localStorage.getItem("sb_license:clipboard-lan-bridge"), verdict: JSON.parse(localStorage.getItem("sb_license_verdict:clipboard-lan-bridge") || "{}") }))).toEqual({ token: "fixture-license-token", verdict: expect.objectContaining({ valid: true, reason: "ok" }) });

});
