---
id: mobile-wallets
title: Mobile Wallet Testing
sidebar_label: Mobile Wallets
slug: /mobile-wallets
---

# Mobile Wallet Testing

As Web3 adoption grows, mobile wallets have become increasingly important entry points for users. This guide covers how to test dApp interactions with mobile wallets using Web3FuzzForge.

## Overview of Mobile Wallet Testing

Mobile wallet testing presents unique challenges:

1. **QR Code Interactions**: Many mobile wallets use QR codes for connection
2. **Deep Linking**: Testing requires understanding of wallet-specific deep link schemes
3. **Device Emulation**: Testing across different device types and screen sizes
4. **WalletConnect Integration**: Most mobile wallets implement the WalletConnect protocol
5. **Platform-Specific Behaviors**: Android and iOS wallets may behave differently

## Supported Mobile Wallets

Web3FuzzForge provides testing capabilities for the following mobile wallets:

| Wallet | Platforms | Connection Methods | Testing Support Level |
|--------|-----------|--------------------|-----------------------|
| MetaMask Mobile | iOS, Android | WalletConnect, Deep Links | Full |
| Trust Wallet | iOS, Android | WalletConnect | Full |
| Coinbase Wallet | iOS, Android | WalletConnect, SDK | Full |
| Rainbow | iOS | WalletConnect | Full |
| imToken | iOS, Android | WalletConnect | Full |
| Argent | iOS, Android | WalletConnect | Full |
| Spot | iOS, Android | WalletConnect | Basic |
| Phantom | iOS, Android | WalletConnect, Custom Protocol | Full (Solana) |
| ZenGo | iOS, Android | WalletConnect | Basic |
| Alpha Wallet | iOS, Android | WalletConnect | Basic |

## Setting Up Mobile Wallet Tests

### Prerequisites

1. Install the required dependencies:

```bash
npm install @web3fuzzforge/mobile-testing
```

2. Configure your project for mobile testing:

```bash
web3fuzzforge setup-mobile
```

### Basic WalletConnect Test

WalletConnect is the foundation for most mobile wallet integrations. Here's a basic test:

```javascript
test('should connect via WalletConnect', async ({ page }) => {
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Click the connect button
  await page.click('#connect-wallet');
  
  // Select WalletConnect option
  await page.click('[data-testid="walletconnect-option"]');
  
  // Verify QR code is displayed
  const qrCodeVisible = await page.isVisible('[data-testid="qr-code"]');
  expect(qrCodeVisible).toBeTruthy();
  
  // Simulate wallet scan (using the mock mobile wallet)
  await simulateWalletConnectScan(page);
  
  // Verify connection established
  await page.waitForSelector('[data-testid="connected-status"]');
  
  // Verify wallet address is displayed
  const addressVisible = await page.isVisible('[data-testid="wallet-address"]');
  expect(addressVisible).toBeTruthy();
});
```

### Using Mobile Wallet Mocks

For automated testing, Web3FuzzForge provides mock implementations of popular mobile wallets:

```javascript
// Import mobile wallet mocks
const { MetaMaskMobile, TrustWallet, CoinbaseWalletMobile } = require('@web3fuzzforge/mobile-testing');

test('should connect with MetaMask Mobile', async ({ page }) => {
  // Initialize the mock
  const metaMaskMobile = await MetaMaskMobile.initialize({
    addresses: ['0x123...'],
    chainId: '0x1',
    balance: '1000000000000000000'
  });
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Connect using the mock
  await metaMaskMobile.connect(page);
  
  // Verify connection
  await page.waitForSelector('[data-testid="connected-status"]');
  
  // Simulate a transaction
  await page.click('#send-transaction');
  
  // Approve the transaction in the mock wallet
  await metaMaskMobile.approveTransaction();
  
  // Verify transaction success
  await page.waitForSelector('[data-testid="transaction-success"]');
});
```

## Testing QR Code Interactions

Testing QR code interactions requires capturing and parsing QR codes:

```javascript
test('should generate valid WalletConnect QR code', async ({ page }) => {
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Connect via WalletConnect
  await page.click('#connect-wallet');
  await page.click('[data-testid="walletconnect-option"]');
  
  // Capture QR code image
  const qrCodeElement = await page.$('[data-testid="qr-code"]');
  await qrCodeElement.screenshot({ path: 'qrcode.png' });
  
  // Parse QR code to get WalletConnect URI
  const uri = await parseQRCode('qrcode.png');
  
  // Verify URI format
  expect(uri).toMatch(/^wc:/);
  
  // Verify URI contains required parameters
  const uriParams = new URL(uri.replace('wc:', 'wc://'));
  expect(uriParams.searchParams.has('bridge')).toBeTruthy();
  expect(uriParams.searchParams.has('key')).toBeTruthy();
});
```

## Testing Deep Linking

Many mobile wallets support deep linking. Here's how to test deep link generation:

```javascript
test('should generate valid MetaMask deep link', async ({ page }) => {
  // Configure mock for deep link testing
  await page.evaluate(() => {
    window.ethereum = {
      ...window.ethereum,
      isMetaMask: true,
      isMobile: true
    };
  });
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Click connect button
  await page.click('#connect-wallet');
  
  // Check for deep link generation
  const deepLink = await page.evaluate(() => {
    return document.querySelector('a[href^="metamask://"]')?.href;
  });
  
  // Verify deep link structure
  expect(deepLink).toBeTruthy();
  expect(deepLink).toContain('metamask://');
});
```

## Platform-Specific Testing

### iOS Testing

For iOS-specific wallet behavior:

```javascript
test('should handle iOS wallet interactions', async ({ page }) => {
  // Set iOS user agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  // Enable iOS device emulation
  await page.setViewportSize({
    width: 375,
    height: 812
  });
  
  // Test dApp with iOS settings
  await page.goto('https://your-dapp.com');
  
  // Verify iOS-specific UI adaptations
  const iosSpecificElement = await page.isVisible('[data-testid="ios-wallet-button"]');
  expect(iosSpecificElement).toBeTruthy();
});
```

### Android Testing

For Android-specific wallet behavior:

```javascript
test('should handle Android wallet interactions', async ({ page }) => {
  // Set Android user agent
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36'
  });
  
  // Enable Android device emulation
  await page.setViewportSize({
    width: 412,
    height: 915
  });
  
  // Test dApp with Android settings
  await page.goto('https://your-dapp.com');
  
  // Verify Android-specific UI adaptations
  const androidSpecificElement = await page.isVisible('[data-testid="android-intent-button"]');
  expect(androidSpecificElement).toBeTruthy();
});
```

## Advanced Mobile Wallet Testing

### Testing with Real Devices

For testing with real devices using Appium:

```javascript
test('Mobile wallet integration with real device', async () => {
  // This test requires Appium setup and real device or emulator
  const appiumConfig = {
    platformName: 'Android',
    deviceName: 'Pixel 6',
    app: '/path/to/wallet.apk'
  };
  
  // Initialize Appium driver (requires Appium setup)
  const driver = await initializeAppiumDriver(appiumConfig);
  
  // Launch wallet app
  await driver.launchApp();
  
  // Navigate to scan QR screen
  await driver.tap('[resource-id="scan-button"]');
  
  // Generate QR code in web app
  const qrCodeUrl = await generateWalletConnectQR();
  
  // Scan QR code with device camera
  await scanQRWithAppium(driver, qrCodeUrl);
  
  // Verify connection in wallet app
  const connectionApprovalButton = await driver.waitForElementVisible('[resource-id="approve-button"]');
  await connectionApprovalButton.click();
  
  // Verify successful connection
  await driver.waitForElementVisible('[resource-id="connected-status"]');
});
```

### WalletConnect v2 Testing

WalletConnect v2 introduces new capabilities:

```javascript
test('should connect via WalletConnect v2', async ({ page }) => {
  // Initialize WalletConnect v2 mock
  const wcV2Mock = await WalletConnectV2Mock.initialize({
    addresses: ['0x123...'],
    chainId: '0x1'
  });
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Connect using WalletConnect v2
  await page.click('#connect-wallet');
  await page.click('[data-testid="walletconnect-option"]');
  
  // Capture WC v2 URI
  const wcUri = await captureWalletConnectUri(page);
  
  // Connect mock wallet using URI
  await wcV2Mock.connectWithUri(wcUri);
  
  // Verify connection
  await page.waitForSelector('[data-testid="connected-status"]');
  
  // Test chain switching in WC v2
  await page.click('#switch-network');
  await wcV2Mock.switchChain('0x89'); // Polygon
  
  // Verify chain switched successfully
  await page.waitForSelector('[data-testid="network-polygon"]');
});
```

## Security Testing for Mobile Wallets

Mobile wallets have specific security considerations:

```javascript
test('should detect insecure deep links', async ({ page }) => {
  // Setup mock for deep link testing
  await setupMobileMock(page);
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  
  // Intercept and monitor all generated deep links
  const deepLinks = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('metamask://') || url.startsWith('trust://')) {
      deepLinks.push(url);
    }
    route.continue();
  });
  
  // Interact with dApp
  await page.click('#connect-wallet');
  await page.click('#send-transaction');
  
  // Check for sensitive data in deep links
  const sensitiveDataInLinks = deepLinks.some(link => {
    return link.includes('privateKey') || 
           link.includes('seedPhrase') || 
           link.includes('secret');
  });
  
  // Deep links should never contain sensitive data
  expect(sensitiveDataInLinks).toBeFalsy();
});
```

## Best Practices for Mobile Wallet Testing

1. **Test Responsiveness**: Ensure your dApp adapts to mobile screen sizes
2. **Test Multiple Connection Methods**: Test both QR code and deep linking
3. **Test Disconnection Handling**: Verify graceful handling of wallet disconnection
4. **Test Transaction Signing**: Verify transaction signing flows
5. **Test Error Scenarios**: Test network outages and delayed responses
6. **Cross-Platform Testing**: Test on both iOS and Android emulators

## Troubleshooting Mobile Wallet Tests

### Common Issues and Solutions

1. **QR Code Not Recognized**
   - Ensure the QR code is visible and not blocked by other elements
   - Check QR code resolution and contrast

2. **Deep Links Not Working**
   - Verify correct URI scheme format
   - Ensure deep link handling is correctly implemented in the dApp

3. **Connection Timeouts**
   - Increase timeout thresholds in your tests
   - Check network connectivity in testing environment

4. **Inconsistent Mobile Behavior**
   - Use stable device emulation profiles
   - Set consistent viewport sizes and user agents

## Conclusion

Mobile wallet testing is crucial for ensuring wide accessibility of your dApp. With Web3FuzzForge's mobile testing capabilities, you can ensure your dApp provides a seamless experience across both desktop and mobile wallet users.
