---
id: community-test-examples
title: Community Test Examples
sidebar_label: Community Examples
slug: /community-test-examples
---

# Community Test Examples

This section showcases real-world test examples contributed by the Web3FuzzForge community. These examples demonstrate how to test for common vulnerabilities and edge cases in Web3 applications.

## Security Test Examples

### Detecting Unlimited Token Approvals

This test identifies dApps that request unlimited token approvals, a common security risk:

```javascript
test('should detect unlimited token approvals', async ({ page }) => {
  // Setup wallet and connect to dApp
  await connectWallet(page);
  
  // Navigate to token approval section
  await page.goto('https://your-dapp.com/swap');
  
  // Initiate a token approval transaction
  await page.click('#approve-token');
  
  // Check approval transaction details
  const transactionDetails = await getWalletTransactionDetails(page);
  
  // Check if approval amount equals max uint256 (unlimited approval)
  const isUnlimitedApproval = transactionDetails.data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  
  // Log finding if unlimited approval detected
  if (isUnlimitedApproval) {
    console.log('SECURITY RISK: Unlimited token approval detected');
    
    // Take screenshot as evidence
    await page.screenshot({ path: 'unlimited-approval-evidence.png' });
  }
  
  // Assert against unlimited approvals
  expect(isUnlimitedApproval).toBeFalsy();
});
```

### Testing for Front-Running Vulnerability

This test checks if a dApp is vulnerable to front-running attacks:

```javascript
test('should check for front-running vulnerability', async ({ page }) => {
  // Setup wallet with test funds
  await setupWalletState(page, {
    balance: '10000000000000000000' // 10 ETH
  });
  
  // Connect to DEX or trading dApp
  await page.goto('https://your-dex.com');
  await connectWallet(page);
  
  // Fill trade form with large trade that would impact price
  await page.fill('#trade-amount', '5'); // 5 ETH
  await page.selectOption('#token-to-buy', 'TOKEN');
  
  // Check if there's a warning about slippage or front-running
  const hasFrontRunningProtection = await page.isVisible('#slippage-warning');
  const hasTimeLimit = await page.isVisible('[data-testid="transaction-deadline"]');
  
  // Capture evidence
  if (!hasFrontRunningProtection || !hasTimeLimit) {
    await page.screenshot({ path: 'front-running-vulnerability.png' });
  }
  
  // Log findings
  if (!hasFrontRunningProtection) {
    console.log('SECURITY RISK: No front-running protection detected');
  }
  
  if (!hasTimeLimit) {
    console.log('SECURITY RISK: No transaction time limit protection detected');
  }
  
  // Assert proper protections are in place
  expect(hasFrontRunningProtection).toBeTruthy();
  expect(hasTimeLimit).toBeTruthy();
});
```

### Detecting Race Conditions in Network Switching

This test identifies potential race conditions when switching networks:

```javascript
test('should detect network switching race conditions', async ({ page }) => {
  // Setup wallet
  await setupWalletState(page);
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  await connectWallet(page);
  
  // Initiate rapid network switches
  const switchPromises = [];
  const networks = ['0x1', '0x89', '0x1', '0x89']; // ETH, Polygon, ETH, Polygon
  
  for (const chainId of networks) {
    switchPromises.push(
      page.evaluate(id => {
        return window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: id }]
        });
      }, chainId)
    );
  }
  
  // Execute all network switches in parallel
  await Promise.all(switchPromises);
  
  // Check if dApp state is corrupted
  const isAppStateConsistent = await page.evaluate(() => {
    // Check if UI correctly shows current network
    const networkDisplay = document.querySelector('#network-display');
    const currentChainId = window.ethereum.chainId;
    
    return networkDisplay && networkDisplay.textContent.includes(currentChainId);
  });
  
  // Take evidence
  if (!isAppStateConsistent) {
    await page.screenshot({ path: 'network-race-condition.png' });
    console.log('SECURITY RISK: Network switching race condition detected');
  }
  
  expect(isAppStateConsistent).toBeTruthy();
});
```

## Transaction Test Examples

### Testing Transaction with Malformed Data

This test verifies how your dApp handles transactions with malformed data:

```javascript
test('should handle transaction with malformed data', async ({ page }) => {
  // Setup and connect wallet
  await setupWalletState(page);
  await page.goto('https://your-dapp.com/send');
  await connectWallet(page);
  
  // Attempt to inject malformed data into transaction
  await page.evaluate(() => {
    // Override the transaction sending function
    const originalSendTransaction = window.ethereum.request;
    window.ethereum.request = async (args) => {
      if (args.method === 'eth_sendTransaction') {
        // Inject malformed data 
        args.params[0].data = '0xinvaliddata';
      }
      return originalSendTransaction.call(window.ethereum, args);
    };
  });
  
  // Initiate transaction
  await page.fill('#recipient', '0x1234567890123456789012345678901234567890');
  await page.fill('#amount', '0.001');
  await page.click('#send-button');
  
  // Check for proper error handling
  const errorShown = await page.isVisible('#error-message');
  
  if (!errorShown) {
    console.log('SECURITY RISK: No error handling for malformed transaction data');
    await page.screenshot({ path: 'malformed-data-no-error.png' });
  }
  
  expect(errorShown).toBeTruthy();
});
```

### Testing Extreme Gas Prices

This test checks how a dApp handles extremely high gas prices:

```javascript
test('should handle transaction with extremely high gas price', async ({ page }) => {
  // Setup wallet
  await setupWalletState(page);
  
  // Connect to dApp
  await page.goto('https://your-dapp.com');
  await connectWallet(page);
  
  // Override the gas price to an extremely high value
  await page.evaluate(() => {
    const originalSendTransaction = window.ethereum.request;
    window.ethereum.request = async (args) => {
      if (args.method === 'eth_sendTransaction') {
        // Set an extremely high gas price
        args.params[0].gasPrice = '0x1000000000000000'; // Extremely high
      }
      return originalSendTransaction.call(window.ethereum, args);
    };
  });
  
  // Initiate a transaction
  await page.click('#transaction-button');
  
  // Check if dApp warns about high gas price
  const highGasWarning = await page.isVisible('#high-gas-warning');
  
  if (!highGasWarning) {
    console.log('SECURITY RISK: No warning for extremely high gas price');
    await page.screenshot({ path: 'high-gas-no-warning.png' });
  }
  
  expect(highGasWarning).toBeTruthy();
});
```

## Wallet Interaction Examples

### Detecting Phishing Attempts

This test verifies if a dApp requests sensitive wallet operations without proper context:

```javascript
test('should detect potential phishing attempts', async ({ page }) => {
  // Setup wallet with valuable assets
  await setupWalletState(page, {
    nfts: [{ tokenId: '1', address: '0xnft...' }],
    tokens: [{ symbol: 'USDC', balance: '1000000000' }]
  });
  
  // Navigate to dApp
  await page.goto('https://your-dapp.com');
  await connectWallet(page);
  
  // Monitor for personal_sign or eth_sign without proper context
  let phishingAttemptDetected = false;
  await page.evaluate(() => {
    window.potentialPhishingAttempts = [];
    const originalRequest = window.ethereum.request;
    
    window.ethereum.request = async (args) => {
      // Check for potentially dangerous signing methods
      if (args.method === 'personal_sign' || args.method === 'eth_sign') {
        window.potentialPhishingAttempts.push({
          method: args.method,
          params: args.params,
          url: window.location.href,
          timestamp: Date.now()
        });
      }
      return originalRequest.call(window.ethereum, args);
    };
  });
  
  // Interact with the dApp normally
  await page.click('#start-button');
  await page.waitForTimeout(5000); // Allow time for dApp to operate
  
  // Check if any potential phishing attempts occurred
  phishingAttemptDetected = await page.evaluate(() => {
    return window.potentialPhishingAttempts.length > 0;
  });
  
  if (phishingAttemptDetected) {
    const phishingData = await page.evaluate(() => window.potentialPhishingAttempts);
    console.log('SECURITY RISK: Potential phishing attempt detected', phishingData);
    await page.screenshot({ path: 'potential-phishing.png' });
  }
  
  expect(phishingAttemptDetected).toBeFalsy();
});
```

## Contributing Your Own Examples

We welcome community contributions to our test examples! To submit your own:

1. Fork the Web3FuzzForge repository
2. Add your test to the `web3fuzzforge-community-tests` directory
3. Include detailed documentation on what vulnerability it detects
4. Submit a pull request

You can also share your test examples in our community channels.

## Run Community Examples

To run the community examples directly:

```bash
# Clone the community tests repo
git clone https://github.com/web3fuzzforge/web3fuzzforge-community-tests.git

# Install dependencies
cd web3fuzzforge-community-tests
npm install

# Run a specific test category
npx web3fuzzforge run --test-dir=dapp-tests/transaction-flow
```
