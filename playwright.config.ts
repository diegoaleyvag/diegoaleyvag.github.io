import { defineConfig, devices } from "@playwright/test";

const staticOrigin = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  workers: 1,
  reporter: "list",
  outputDir: ".cache/playwright",
  use: {
    baseURL: staticOrigin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node --import tsx tests/e2e/static-server.ts",
    url: staticOrigin,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
