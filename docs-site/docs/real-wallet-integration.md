---
sidebar_position: 1
---

# Real Wallet Integration

While Web3FuzzForge primarily uses mocked wallet behavior for testing, there are scenarios where testing with real wallets provides additional coverage and security verification.

## Why Test with Real Wallets

Testing with real wallets provides several benefits:

1. **Complete Validation**: Ensure your application works with actual wallet implementations, not just mocks
2. **UI/UX Verification**: Test the complete user experience including wallet popups and interfaces
3. **RPC Communication**: Verify actual blockchain communication patterns
4. **Security Boundary Testing**: Check cross-domain security measures in production wallets
5. **Version Compatibility**: Ensure compatibility with different wallet versions

## Approaches to Real Wallet Testing

### 1. Controlled Test Wallets

Create dedicated test wallets with:

- Minimal funds on test networks
- No access to production assets
- Clear separation from development wallets

```javascript
test('Test with actual MetaMask wallet', async ({ page, context }) => {
  // Launch browser with MetaMask extension installed
  // Extension path needs to be configured in playwright.config.js

  // Navigate to your MetaMask setup page
  await page.goto('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html');

  // Import test wallet using seed phrase
  await page.fill('#seed-phrase', 'your test wallet seed phrase');

  // Set test wallet password
  await page.fill('#password', 'your-secure-test-password');

  // Continue with test...
});
```

### 2. Sandboxed Environment

Set up an isolated testing environment:

- Docker containers with browser + wallet extensions
- Virtual machines with controlled network access
- CI/CD pipeline with ephemeral wallets

### 3. Hybrid Testing Approach

Combine real and mocked wallet testing:

- Use mocks for fast unit and integration tests
- Use real wallets for key security verification tests
- Use real wallets for final acceptance tests

## Configuring Real Wallet Tests

### MetaMask Integration

```javascript
// In your playwright.config.js
const config = {
  use: {
    // Launch options to include the MetaMask extension
    launchOptions: {
      args: [
        `--disable-extensions-except=${path.join(__dirname, 'path/to/metamask')}`,
        `--load-extension=${path.join(__dirname, 'path/to/metamask')}`,
      ],
    },
  },
};
```

### WalletConnect Integration

```javascript
test('Test with real WalletConnect', async ({ page }) => {
  // Navigate to your dApp
  await page.goto('https://your-dapp.com');

  // Click connect button to trigger WalletConnect
  await page.click('#connect-wallet');

  // Get WalletConnect QR code
  const qrCodeData = await page.evaluate(() => {
    return document.querySelector('.walletconnect-qrcode').getAttribute('data-qrcode');
  });

  // In a real test, you'd use a QR code scanner or direct URI handling
  // For testing purposes, you can use a mobile device automation tool
  // to scan this QR and confirm the connection
});
```

## Security Considerations

When testing with real wallets:

1. **Never use production wallets** or wallets with real assets
2. **Create specific test wallets** with minimal permissions
3. **Use test networks** like Sepolia, Mumbai, or Devnet
4. **Rotate test wallet credentials** regularly
5. **Store test wallet credentials securely** using vault solutions or CI/CD secrets
6. **Limit network access** to prevent accidental interactions with production networks

## Future Improvements

We're working on the following improvements for real wallet testing:

1. **Automated wallet initialization**: Scripts to create and fund test wallets automatically
2. **Docker images** with pre-installed wallets for consistent testing environments
3. **Mobile wallet automation** for both Android and iOS testing
4. **WalletConnect QR code handling** for automated WalletConnect tests
5. **Multi-chain test suite** for cross-chain application testing

## Community Examples

Check out our [community-test-examples](community-test-examples) section for contributed examples of real wallet testing setups from the Web3FuzzForge community.
