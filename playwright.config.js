/**
 * Playwright Configuration for Web3FuzzForge
 * 
 * This configuration sets up the test environment for Web3 testing,
 * including options for different browsers, viewport settings,
 * timeout controls, and reporting options.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// @ts-check
const { defineConfig, devices } = require('@playwright/test')
const path = require('path')

/**
 * Read environment variables for test configuration
 */
function getTestModeConfig() {
  // Default configuration
  const config = {
    mockMode: process.env.MOCK_MODE === 'true',
    targetUrl: process.env.TARGET_URL || '',
    selfContained: process.env.SELF_CONTAINED === 'true',
  }

  // For tests that don't need external URLs (self-contained tests)
  if (config.selfContained) {
    return { selfContained: true }
  }

  // If no target URL is provided and not in mock mode or self-contained mode, use mock mode by default
  if (!config.targetUrl && !config.mockMode && !config.selfContained) {
    console.warn('No TARGET_URL or MOCK_MODE provided, defaulting to self-contained tests.')
    return { selfContained: true }
  }

  // If mock mode is enabled, set the target URL to the local mock dApp
  if (config.mockMode) {
    config.targetUrl = 'http://localhost:3002'
  }

  return config
}

// Get test mode configuration
const testConfig = getTestModeConfig()

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  // Test directory and test file pattern
  testDir: './',
  testMatch: '**/*.test.js',
  
  // Timeout settings
  timeout: 60000,      // Each test has 60 seconds to complete
  expect: {
    timeout: 10000,    // Wait up to 10 seconds for expect() conditions
  },

  // Common test settings
  fullyParallel: false,  // Tests in a single file are not run in parallel
  forbidOnly: !!process.env.CI,  // Fail if test.only is in the source code when running in CI
  retries: process.env.CI ? 2 : 0,  // Retry failed tests only in CI environment
  workers: process.env.CI ? 1 : undefined,  // Set number of workers for parallel execution
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],  // HTML report
    ['list']  // Console output
  ],

  // Browser configurations for tests
  use: {
    // Collecting trace on failure helps with debugging
    trace: 'on-first-retry',  
    
    // Browser viewport size
    viewport: { width: 1280, height: 720 },
    
    // Maximum time for each action to complete
    actionTimeout: 20000,
    
    // Maximum time for each navigation to complete
    navigationTimeout: 30000,

    // Base URL to use in actions like `await page.goto('/')`
    baseURL: testConfig.selfContained ? undefined : testConfig.targetUrl || undefined,

    // Take screenshot on test failure
    screenshot: 'only-on-failure',

    // Video recording settings
    video: 'on-first-retry',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Settings for Web3 testing with MetaMask
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-insecure-localhost',
          ]
        }
      },
    },
    /*
    // Uncomment to enable Firefox testing
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    
    // Uncomment to enable WebKit (Safari) testing
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    */
  ],

  // Folder for test artifacts like screenshots, videos, traces, etc.
  outputDir: 'test-output/',
}

module.exports = defineConfig(config)
