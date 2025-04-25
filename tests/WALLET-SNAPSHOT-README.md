# Wallet Snapshot Testing Guide

This guide demonstrates how to use wallet state snapshots effectively in your Web3 application tests.

## Introduction

Wallet state snapshots allow you to:

- Save the current state of a wallet (address, chain ID, etc.)
- Restore a previously saved state
- Test complex user flows that involve multiple wallet states
- Compare different wallet configurations

## Basic Usage Pattern

Here's the recommended pattern for wallet state testing:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Wallet State Tests', () => {
  // Create page and setup test page in beforeEach

  // Helper to save wallet state
  async function saveState(page) {
    return await page.evaluate(() => {
      return {
        connected: window.ethereum.selectedAddress !== null,
        address: window.ethereum.selectedAddress,
        chainId: window.ethereum.chainId,
        networkVersion: window.ethereum.networkVersion,
        // Add any other state you need to save
      };
    });
  }

  // Helper to restore wallet state
  async function restoreState(page, state) {
    await page.evaluate(state => {
      // Restore ethereum properties
      window.ethereum.selectedAddress = state.address;
      window.ethereum.chainId = state.chainId;
      window.ethereum.networkVersion = state.networkVersion;

      // Update UI to match (important!)
      updateUI();

      function updateUI() {
        // Update wallet info display
        if (state.connected) {
          document.getElementById('wallet-info').style.display = 'block';
          document.getElementById('address').textContent = state.address;
          // Update network display
        } else {
          document.getElementById('wallet-info').style.display = 'none';
          // Clear wallet UI
        }
      }
    }, state);
  }

  test('Sample wallet state test', async () => {
    // Connect wallet
    await connectWallet(page);

    // Save connected state
    const connectedState = await saveState(page);

    // Disconnect wallet
    await disconnectWallet(page);

    // Restore connected state
    await restoreState(page, connectedState);

    // Verify wallet is connected again
    const walletAddress = await page.locator('#address').textContent();
    expect(walletAddress).toBe(connectedState.address);
  });
});
```

## Important Tips

1. **Direct DOM Manipulation**

   - Always update the UI elements directly when restoring state
   - Don't rely on UI events to trigger updates

2. **Thorough State Saving**

   - Save all relevant state properties
   - Include UI state information when needed
   - Add timestamps or other metadata for debugging

3. **Explicit State Restoration**

   - Restore all properties explicitly
   - Update UI elements to match the restored state
   - Use helper functions to simplify repetitive operations

4. **Error Handling**
   - Add null checks for all DOM elements
   - Implement proper error handling for edge cases
   - Log state changes for debugging

## Complete Example

For a complete, working example of wallet state testing, see [wallet-snapshot-simple.test.js](./wallet-snapshot-simple.test.js).

## Running the Tests

To run the wallet snapshot tests:

```bash
# Set environment variables and run tests
$env:MOCK_MODE="true"; npx playwright test tests/wallet-snapshot-simple.test.js --headed
```

## Troubleshooting

**Problem:** UI elements don't update when state is restored.

**Solution:** Make sure to explicitly update the UI in your restore function:

```javascript
// Always manually update UI elements after state change
function updateUI() {
  document.getElementById('wallet-info').style.display = state.connected ? 'block' : 'none';
  document.getElementById('address').textContent = state.address || 'Not connected';
  // Update other UI elements...
}
```

**Problem:** State saving returns null.

**Solution:** Add fallback values and better validation:

```javascript
// Helper with fallback values
async function saveState(page) {
  const state = await page.evaluate(() => {
    const defaultState = {
      connected: false,
      address: null,
      chainId: '0x1',
    };

    if (!window.ethereum) {
      console.error('No wallet detected, using default state');
      return defaultState;
    }

    return {
      connected: window.ethereum.selectedAddress !== null,
      address: window.ethereum.selectedAddress || defaultState.address,
      chainId: window.ethereum.chainId || defaultState.chainId,
    };
  });

  // Add timestamp for debugging
  state.timestamp = new Date().toISOString();
  return state;
}
```
