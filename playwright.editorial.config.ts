import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: /editorial-.*\.spec\.ts/,
  use: { ...base.use, serviceWorkers: "block" },
  projects: [
    { name: "chromium-mobile", use: { ...devices["Pixel 5"] } },
    { name: "webkit-iphone", testIgnore: /editorial-visual\.spec\.ts/, use: { ...devices["iPhone 12"] } },
  ],
});
