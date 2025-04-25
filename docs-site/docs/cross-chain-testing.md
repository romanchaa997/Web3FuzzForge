---
sidebar_position: 3
---

# Cross-Chain Testing

As multi-chain dApps become increasingly common, comprehensive testing across different blockchain networks is critical. Web3FuzzForge provides tools and patterns for testing cross-chain functionality.

## Cross-Chain Testing Overview

Cross-chain testing involves verifying that your application functions correctly when:

1. Switching between different blockchain networks
2. Processing transactions on multiple chains simultaneously
3. Handling cross-chain bridging operations
4. Maintaining consistent state across multiple networks
5. Supporting wallets with varying chain capabilities

## Supported Blockchain Networks

Web3FuzzForge test templates can be configured for multiple networks:

| Network   | Chain ID | Test Networks                    |
| --------- | -------- | -------------------------------- |
| Ethereum  | 0x1      | Sepolia (0xaa36a7), Goerli (0x5) |
| Polygon   | 0x89     | Mumbai (0x13881)                 |
| Arbitrum  | 0xa4b1   | Arbitrum Goerli (0x66eed)        |
| Optimism  | 0xa      | Optimism Goerli (0x1a4)          |
| BNB Chain | 0x38     | BSC Testnet (0x61)               |
| Avalanche | 0xa86a   | Fuji (0xa869)                    |
| Solana    | N/A      | Devnet, Testnet                  |

## Test Templates for Multi-Chain dApps

### Network Switching Tests

```javascript
test('Test network switching', async ({ page }) => {
  // Set up initial wallet state on Ethereum
  await setupWalletState(page, {
    chainId: '0x1', // Ethereum Mainnet
  });

  // Verify we're on Ethereum
  const initialChainId = await page.evaluate(() => {
    return window.ethereum.request({ method: 'eth_chainId' });
  });
  expect(initialChainId).toBe('0x1');

  // Switch to Polygon
  await page.evaluate(() => {
    return window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // Polygon
    });
  });

  // Verify the app handles the network switch
  await page.waitForSelector('[data-testid="network-polygon"]');

  // Verify chain ID update
  const newChainId = await page.evaluate(() => {
    return window.ethereum.request({ method: 'eth_chainId' });
  });
  expect(newChainId).toBe('0x89');

  // Test app functionality on the new network
  await page.click('#transaction-button');
  // ... Continue testing on Polygon
});
```

### Cross-Chain State Consistency

```javascript
test('Test cross-chain state consistency', async ({ page }) => {
  // Set up wallet state
  const walletState = await setupWalletState(page);

  // Interact with app on Ethereum
  await page.evaluate(() => {
    return window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    });
  });

  // Record application state
  const ethereumState = await page.evaluate(() => {
    return {
      balance: document.querySelector('#balance').textContent,
      nfts: document.querySelector('#nft-count').textContent,
    };
  });

  // Switch to Polygon
  await page.evaluate(() => {
    return window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }],
    });
  });

  // Wait for app to update
  await page.waitForSelector('[data-testid="network-polygon"]');

  // Compare relevant state that should be consistent
  const polygonState = await page.evaluate(() => {
    return {
      userAddress: document.querySelector('#user-address').textContent,
      // Other relevant state to compare
    };
  });

  // Verify address stays consistent across chains
  expect(polygonState.userAddress).toBe(walletState.selectedAddress);
});
```

### Bridge Transaction Testing

```javascript
test('Test cross-chain bridge transaction', async ({ page }) => {
  // Start on Ethereum
  await setupWalletState(page, { chainId: '0x1' });

  // Navigate to bridge UI
  await page.goto('https://your-dapp.com/bridge');

  // Configure source chain (Ethereum)
  await page.selectOption('#source-chain', 'ethereum');

  // Configure destination chain (Polygon)
  await page.selectOption('#destination-chain', 'polygon');

  // Input amount to bridge
  await page.fill('#bridge-amount', '0.01');

  // Initiate bridge transaction
  await page.click('#bridge-button');

  // Approve transaction in wallet
  await page.click('[data-testid="confirm-transaction"]');

  // Verify transaction started
  await page.waitForSelector('[data-testid="transaction-pending"]');

  // Mock transaction completion (in real testing, you might wait longer or use events)
  await page.evaluate(() => {
    // Simulating a completed transaction
    document
      .querySelector('[data-testid="transaction-pending"]')
      .setAttribute('data-testid', 'transaction-complete');
  });

  // Verify bridge transaction completes
  await page.waitForSelector('[data-testid="transaction-complete"]');
});
```

## Chain-Specific Considerations

### EVM Chain Testing

For Ethereum Virtual Machine (EVM) compatible chains:

```javascript
// Helper function to test on multiple EVM chains
async function testOnChain(page, chainId, chainName) {
  // Switch to specified chain
  await page.evaluate(id => {
    return window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: id }],
    });
  }, chainId);

  // Verify chain switch
  const currentChain = await page.evaluate(() => {
    return window.ethereum.request({ method: 'eth_chainId' });
  });
  expect(currentChain).toBe(chainId);

  console.log(`Testing on ${chainName}...`);

  // App-specific testing on this chain
  // ...
}

test('Multi-chain EVM test', async ({ page }) => {
  await setupWalletState(page);

  // Test on multiple EVM chains
  await testOnChain(page, '0x1', 'Ethereum Mainnet');
  await testOnChain(page, '0x89', 'Polygon');
  await testOnChain(page, '0xa4b1', 'Arbitrum');
});
```

### Non-EVM Chain Testing

For non-EVM chains like Solana:

```javascript
test('Test Solana interactions', async ({ page }) => {
  // Set up Phantom wallet with Solana
  await setupPhantomWallet(page, { network: 'mainnet-beta' });

  // Navigate to Solana dApp
  await page.goto('https://your-solana-dapp.com');

  // Connect Phantom wallet
  await page.click('#connect-wallet');
  await page.click('[data-testid="phantom-connect"]');

  // Verify connection to Phantom
  const isConnected = await page.evaluate(() => {
    return window.solana && window.solana.isConnected;
  });
  expect(isConnected).toBeTruthy();

  // Test Solana-specific functionality
  // ...
});
```

## Best Practices for Cross-Chain Testing

1. **Test on Testnets First**: Always use test networks before mainnet
2. **Use Test Wallets**: Create specific test wallets for each chain
3. **Isolate Chain-Specific Code**: Test chain-specific logic in isolation
4. **Verify Network Events**: Ensure your app correctly handles network change events
5. **Test Chain ID Detection**: Verify your app correctly identifies the current chain
6. **Test RPC Endpoints**: Verify your app works with different RPC providers
7. **Mock Bridge Delays**: Bridges can take minutes to hours in reality; mock these for testing

## Community Contribution

We welcome community contributions of cross-chain test examples, particularly for:

1. Layer 2 rollups (zkSync, StarkNet)
2. Newer EVM chains (Celo, Fantom, etc.)
3. Non-EVM chains (Solana, Cosmos, Polkadot)
4. Cross-chain bridges

Submit your examples to the `web3fuzzforge-community-tests/cross-chain/` directory with proper documentation.
