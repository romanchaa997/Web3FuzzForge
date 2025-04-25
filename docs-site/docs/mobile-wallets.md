---
sidebar_position: 2
---

# Mobile Wallet Testing

Mobile wallets are increasingly important in the Web3 ecosystem. Web3FuzzForge is expanding support for testing mobile wallet interactions to provide comprehensive coverage for multi-platform applications.

## Current Mobile Wallet Support

Web3FuzzForge currently offers the following mobile wallet testing capabilities:

- Basic WalletConnect QR code generation detection
- Documentation for manual mobile wallet testing
- Test templates for mobile-responsive dApp behavior

## Mobile Wallet Testing Challenges

Testing mobile wallets presents unique challenges:

1. **Device Access**: Tests need access to physical or virtual mobile devices
2. **Wallet App Automation**: Mobile wallet apps have varying levels of automation support
3. **Deep Link Handling**: Managing wallet connection through deep links requires special handling
4. **QR Code Interaction**: Tests need to generate and read QR codes
5. **Multi-Platform Code**: Tests must manage both browser and mobile app contexts

## WalletConnect Mobile Testing

### Basic WalletConnect Flow

```javascript
test('WalletConnect mobile wallet connection', async ({ page }) => {
  // Navigate to your dApp
  await page.goto('https://your-dapp.com');

  // Click connect button to trigger WalletConnect
  await page.click('#connect-wallet');

  // Get WalletConnect QR code or URI
  const wcUri = await page.evaluate(() => {
    return document.querySelector('[data-testid="wc-uri"]').textContent;
  });

  // In a full mobile automation test, you would:
  // 1. Launch mobile wallet app on emulator or real device
  // 2. Send the wcUri to the mobile device
  // 3. Open the URI in the wallet app
  // 4. Approve the connection request in the wallet

  // Wait for connection to complete
  await page.waitForSelector('[data-testid="wallet-connected"]');

  // Verify the connection was successful
  const isConnected = await page.evaluate(() => {
    return window.ethereum.isConnected();
  });

  expect(isConnected).toBeTruthy();
});
```

## Appium Integration

For comprehensive mobile wallet testing, integrate Appium with Playwright:

```javascript
const { remote } = require('webdriverio');
const { test } = require('@playwright/test');

test('Test with mobile wallet using Appium', async ({ page }) => {
  // Start browser test with Playwright
  await page.goto('https://your-dapp.com');

  // Get WalletConnect URI
  await page.click('#connect-wallet');
  const wcUri = await page.evaluate(() => {
    return document.querySelector('[data-testid="wc-uri"]').textContent;
  });

  // Initialize Appium client for mobile device
  const mobileClient = await remote({
    capabilities: {
      platformName: 'Android',
      'appium:deviceName': 'Android Emulator',
      'appium:app': '/path/to/wallet-app.apk',
      // Other Appium capabilities...
    },
  });

  // Use the mobile client to open the wallet app
  await mobileClient.$('//android.widget.Button[@text="Scan"]').click();

  // Send the WalletConnect URI to the device
  // This step varies depending on your setup

  // Approve the connection in the wallet app
  await mobileClient.$('//android.widget.Button[@text="Connect"]').click();

  // Return to the browser test to verify connection
  await page.waitForSelector('[data-testid="wallet-connected"]');

  // Clean up the mobile session
  await mobileClient.deleteSession();
});
```

## Deep Link Testing

For testing deep links with mobile wallets:

```javascript
test('Test wallet deep links', async ({ page, context }) => {
  // Start your dApp
  await page.goto('https://your-dapp.com');

  // Set up listener for new pages (deep links often open new tabs)
  const pagePromise = context.waitForEvent('page');

  // Click connect button that triggers deep link
  await page.click('#connect-with-deep-link');

  // Handle the new page or redirect
  const newPage = await pagePromise;
  await newPage.waitForLoadState();

  // Check if the deep link has the correct format
  const url = newPage.url();
  expect(url).toMatch(/metamask:\/\/|phantom:\/\/|coinbase-wallet:\/\//);

  // In a real test with a mobile device, you'd then:
  // 1. Intercept the deep link
  // 2. Open it on the mobile device
  // 3. Complete the wallet interaction
});
```

## Upcoming Mobile Testing Features

We're working on the following improvements:

1. **Mobile Device Farm Integration**: Connect to device clouds for testing across multiple real devices
2. **Automated QR Code Testing**: Tools to automatically read and process WalletConnect QR codes
3. **React Native Wallet Testing**: Specific utilities for testing React Native wallets
4. **Cross-Platform Test Orchestration**: Coordinate tests across browser and mobile devices
5. **iOS Wallet Support**: Expanded support for iOS-based mobile wallets
6. **Mobile Wallet State Snapshots**: Extend our wallet state snapshot framework to mobile wallets

## Community Mobile Testing Examples

We encourage community contributions of mobile wallet testing examples. To contribute:

1. Create a test example in the `web3fuzzforge-community-tests/mobile-wallets/` directory
2. Include detailed setup instructions for mobile devices or emulators
3. Document any required plugins or extensions
4. Submit a pull request with your example

Join our efforts to expand mobile wallet testing coverage and make the Web3 ecosystem more secure on all platforms!
