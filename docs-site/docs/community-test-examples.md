---
sidebar_position: 2
---

# Community Test Examples

This section showcases community-contributed test examples for Web3 security testing. These examples provide real-world patterns for testing common Web3 vulnerability scenarios.

## Contributing a Test Example

We welcome contributions from the community. To contribute your own test example:

1. Fork the repository
2. Add your example to the appropriate directory in `web3fuzzforge-community-tests/`
3. Include detailed documentation explaining the security concept being tested
4. Submit a pull request with your example

## Available Examples

### Wallet Connection Tests

| Name                             | Description                                              | Author          | Link                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet Connection Hijacking Test | Tests for prevention of malicious connection requests    | @web3-tester    | [View Example](https://github.com/web3fuzzforge/web3-security-test-kit/blob/main/web3fuzzforge-community-tests/dapp-tests/wallet-connection/connection-hijacking-test.js) |
| Multi-Wallet Support Test        | Tests dApp compatibility with different wallet providers | @chain-defender | [View Example](https://github.com/web3fuzzforge/web3-security-test-kit/blob/main/web3fuzzforge-community-tests/dapp-tests/wallet-connection/multi-wallet-test.js)         |

### Transaction Flow Tests

| Name                               | Description                                             | Author         | Link                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transaction Parameter Manipulation | Tests for prevention of transaction parameter tampering | @smart-audit   | [View Example](https://github.com/web3fuzzforge/web3-security-test-kit/blob/main/web3fuzzforge-community-tests/dapp-tests/transaction-flow/tx-parameter-test.js)     |
| Gas Optimization Test              | Tests for reasonable gas limits and price suggestions   | @gas-optimizer | [View Example](https://github.com/web3fuzzforge/web3-security-test-kit/blob/main/web3fuzzforge-community-tests/dapp-tests/transaction-flow/gas-optimization-test.js) |

## Example Details

### Wallet Connection Hijacking Test

This example tests for proper origin verification in wallet connection flows. It simulates:

1. A legitimate connection request
2. A spoofed connection request from an unexpected origin
3. Verification that the dApp properly validates connection origins

The test looks for:

- Origin verification in connection requests
- Proper error handling for invalid connection attempts
- Clear user notifications about connection security

```javascript
// Simplified example
test('wallet connection origin verification', async ({ page }) => {
  // Set up legitimate connection
  await page.goto('https://legitimate-dapp.com');
  await page.click('#connect-wallet');

  // Verify connection success
  await page.waitForSelector('[data-testid="connected-status"]');

  // Set up spoofed connection from unexpected origin
  const spoofedPage = await context.newPage();
  await spoofedPage.goto('https://legitimate-dapp.com');

  // Attempt to inject malicious origin
  await spoofedPage.evaluate(() => {
    // Attempt to spoof origin in connection request
    window.ethereum.request({
      method: 'eth_requestAccounts',
      params: [{ origin: 'https://legitimate-dapp.com' }],
    });
  });

  // Check for proper error handling
  const errorVisible = await spoofedPage.isVisible('[data-testid="connection-error"]');
  expect(errorVisible).toBeTruthy();
});
```

## Requesting New Examples

If you need examples for specific security scenarios, please open an issue on our GitHub repository with:

1. A description of the security scenario
2. The specific vulnerability or pattern you want to test
3. Any reference materials or existing exploits
4. (Optional) A sketch of the test approach you're considering

## Future Plans

We're working to expand our community test examples with:

1. More DeFi-specific vulnerability tests
2. NFT marketplace security tests
3. Cross-chain security tests
4. Token bridge vulnerability tests
5. Mobile wallet security tests

## Guidelines for Example Quality

When contributing examples, please ensure they:

1. Focus on a specific, well-defined security concern
2. Include clear documentation about what's being tested and why
3. Use realistic but safe testing approaches
4. Follow best practices for test structure and readability
5. Include appropriate assertions and verifications
6. Avoid using real assets or mainnet in test examples
