/**
 * @fileoverview Wallet Connection Test
 * 
 * This test demonstrates how to test wallet connection functionality in a dApp.
 * It covers:
 * - Basic wallet connection
 * - Handling connection errors
 * - Network detection and display
 */

const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('../../utils/wallet-setup');

test.describe('Wallet Connection Tests', () => {
  let page;
  let metamask;

  test.beforeEach(async ({ browser }) => {
    // Create a new browser context with the demo dApp URL
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Setup MetaMask extension and get the MetaMask page object
    metamask = await setupMetaMask(browser);
  });

  test('should connect wallet to the dApp', async () => {
    // Navigate to the demo dApp
    await page.goto('http://localhost:1234/');
    
    // Verify page loaded correctly
    await expect(page.locator('h1')).toContainText('Web3 Demo Application');
    
    // Check that wallet is not connected yet
    await expect(page.locator('#wallet-info')).toHaveClass(/hidden/);
    
    // Connect the wallet
    await connectWallet(page, metamask);
    
    // Verify that wallet is connected
    await expect(page.locator('#wallet-info')).not.toHaveClass(/hidden/);
    await expect(page.locator('#wallet-address')).not.toBeEmpty();
    await expect(page.locator('#chain-id')).not.toContainText('Unknown');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-output/wallet-connection-success.png' });
  });

  test('should display correct network information', async () => {
    // Navigate to the demo dApp
    await page.goto('http://localhost:1234/');
    
    // Connect wallet
    await connectWallet(page, metamask);
    
    // Verify network information is displayed correctly
    await expect(page.locator('#network-name')).not.toContainText('Unknown');
    await expect(page.locator('#chain-id')).not.toContainText('Unknown');
    
    // Save information for reporting
    const networkName = await page.locator('#network-name').textContent();
    const chainId = await page.locator('#chain-id').textContent();
    
    console.log(`Connected to network: ${networkName} (Chain ID: ${chainId})`);
  });

  test('should handle wallet rejection', async () => {
    // This test simulates a user rejecting the connection request
    
    // Navigate to the demo dApp
    await page.goto('http://localhost:1234/');
    
    // Mock wallet to reject the connection
    await page.evaluate(() => {
      // Override the ethereum.request method to reject
      const originalRequest = window.ethereum.request;
      window.ethereum.request = async (args) => {
        if (args.method === 'eth_requestAccounts') {
          throw new Error('User rejected the request');
        }
        return originalRequest(args);
      };
    });
    
    // Click connect button and verify it's rejected
    await page.locator('#connect-wallet').click();
    
    // Wait for error message
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Failed to connect wallet');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-output/wallet-connection-rejected.png' });
  });
});

/**
 * SECURITY CONSIDERATIONS:
 * 
 * When testing wallet connections, look for:
 * 1. Clear indication of connected state to user
 * 2. Proper handling of rejection scenarios
 * 3. Proper event handling for disconnect and chain changes
 * 4. Excessive permission requests
 * 5. Clarity on what network is connected
 */ 