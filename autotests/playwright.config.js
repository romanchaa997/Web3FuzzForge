// @ts-check
const { defineConfig } = require('@playwright/test')

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './sample-tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: process.env.CI
    ? [['html', { outputFolder: '../reports', open: 'never' }], ['list']]
    : [['html', { outputFolder: '../reports', open: 'on-failure' }], ['list']],

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Take screenshot on test failure
    screenshot: 'only-on-failure',

    // Video recording settings
    video: 'on-first-retry',
  },

  // Configure projects for different browsers if needed
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],

  // Folder for test artifacts like screenshots, videos, traces, etc.
  outputDir: '../test-output/',
})
