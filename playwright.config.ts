import { defineConfig, devices } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    screenshot: "on",
    trace: "on-first-retry",
    headless: false,
  },
  outputDir: "./e2e/test-results",
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      name: "Mobile iPhone 14",
      use: {
        ...devices["iPhone 14"],
        channel: "chrome",
      },
    },
  ],
})
