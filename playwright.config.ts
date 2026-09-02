import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  // The desktop preview uses one mockable local bridge. Running the browser
  // files concurrently can let a mobile-site navigation interrupt that bridge.
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: [
    { command: "npm run build:site && npx vite preview --config vite.site.config.ts --host 127.0.0.1", url: "http://127.0.0.1:4173", reuseExistingServer: true },
    { command: "npm run dev -- --host 127.0.0.1", url: "http://127.0.0.1:1420", reuseExistingServer: true }
  ],
  projects: [
    { name: "desktop-chromium", testIgnore: /paid-unlock\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", testIgnore: /paid-unlock\.spec\.ts/, use: { ...devices["Pixel 5"] } },
    // This claim gets a separate worker, browser process, and context. A prior
    // aggregate run lost the shared Chromium process just before this case.
    { name: "paid-unlock-chromium", testMatch: /paid-unlock\.spec\.ts/, use: { ...devices["Desktop Chrome"] } }
  ]
});
