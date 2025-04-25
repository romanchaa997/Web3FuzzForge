---
sidebar_position: 5
---

# Advanced Guides

## Fuzzing Web3 Applications

Web3FuzzForge includes powerful fuzzing capabilities to discover edge cases and potential vulnerabilities:

```bash
web3fuzzforge generate tx --wallet metamask --out ./tests/security-tx-test.js --fuzz
```

This generates a test with fuzzing capabilities that will:

- Test different input combinations
- Try various transaction parameters
- Attempt invalid state transitions
- Test error handling paths

For more targeted fuzzing, use the dedicated `fuzz` command:

```bash
web3fuzzforge fuzz --target=transaction-flow --wallet=metamask
```

## Wallet Support

Web3FuzzForge supports multiple wallets for comprehensive testing:

| Wallet | Support Level | Notes |
|--------|--------------|-------|
| MetaMask | Full | Complete automation of all interactions |
| Coinbase Wallet | Full | Complete support for all operations |
| Phantom | Full | Complete support for Solana dApps |
| WalletConnect | Partial | Connection and basic transactions |
| Rabby | Partial | Basic support for common operations |
| Trust Wallet | Basic | Connection testing only |

Each wallet requires different automation approaches. See the wallet-specific guides for detailed information:

- [MetaMask Integration Guide](real-wallet-integration)
- [Coinbase Wallet Guide](mobile-wallets)
- [Phantom Wallet Guide](mobile-wallets)

## Self-Contained Tests

For more reliable testing that doesn't depend on external servers, use self-contained tests:

```bash
# Generate a self-contained test
web3fuzzforge generate connect --wallet metamask --out ./tests/self-contained.test.js --self-contained

# Run the test
$env:SELF_CONTAINED="true"; npx playwright test tests/self-contained.test.js --headed
```

Self-contained tests provide:

- No need for mock servers
- Faster test execution 
- More consistent results
- Environment-independent operation

## Troubleshooting UI Visibility

If you encounter UI visibility issues, use these specialized techniques:

```javascript
const { forceShowWalletUI } = require('./utils/wallet-snapshot');

// Use direct content checking instead of visibility assertions
const walletAddress = await page.locator('.wallet-address').textContent();
expect(walletAddress).toContain('0x123...');

// Force UI elements to show programmatically
await page.evaluate(() => {
  const walletInfo = document.getElementById('wallet-info');
  if (walletInfo) walletInfo.style.display = 'block';
});
```

## Cross-Chain Testing

For testing dApps that support multiple chains:

```bash
web3fuzzforge generate tx --wallet metamask --out ./tests/cross-chain.test.js --chains=ethereum,polygon,arbitrum
```

This will generate tests that verify your dApp functions correctly when:

- Switching between networks
- Processing cross-chain transactions
- Handling different RPC endpoints
- Displaying chain-specific information

See the [Cross-Chain Testing Guide](cross-chain-testing) for more details. 