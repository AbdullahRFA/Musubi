import { defineConfig } from "@playwright/test";

/**
 * Regression suite: real browser flows against a running app.
 *   npm run dev            # in another terminal (or set E2E_BASE_URL)
 *   npm run test:e2e
 * PW_CHROMIUM_PATH can point at an installed Chrome/Chromium if Playwright's
 * own browser isn't downloaded (npx playwright install chromium).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 900 },
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    screenshot: "only-on-failure",
  },
});
