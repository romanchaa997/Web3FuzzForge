/**
 * @fileoverview Transaction Flow Test
 * 
 * This test demonstrates how to test transaction functionality in a dApp.
 * It covers:
 * - Basic ETH transfer
 * - ERC20 token transfers
 * - Transaction confirmation monitoring
 * - Error handling
 */

const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('../../utils/wallet-setup');

test.describe('Transaction Flow Tests', () => {
  let page;
  let metamask;
  const testRecipient = '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1'; // Example test address

  test.beforeEach(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Setup MetaMask extension
    metamask = await setupMetaMask(browser);
    
    // Navigate to the demo dApp and connect wallet
    await page.goto('http://localhost:1234/');
    await connectWallet(page, metamask);
    
    // Wait for transaction section to be visible
    await expect(page.locator('#transaction-section')).toBeVisible();
  });

  test('should send ETH transaction', async () => {
    // Fill out transaction details
    await page.locator('#eth-amount').fill('0.001');
    await page.locator('#recipient-address').fill(testRecipient);
    
    // Take screenshot before sending
    await page.screenshot({ path: 'test-output/eth-transaction-before.png' });
    
    // Click send button
    await page.locator('#send-transaction').click();
    
    // Wait for MetaMask confirmation popup
    await metamask.confirmTransaction();
    
    // Verify transaction was sent
    await expect(page.locator('#transaction-result')).toBeVisible();
    await expect(page.locator('#transaction-result')).toContainText('Transaction Sent');
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-output/eth-transaction-result.png' });
    
    // Extract transaction hash for reporting
    const resultText = await page.locator('#transaction-result').textContent();
    const txHash = resultText.match(/0x[a-fA-F0-9]{64}/)?.[0] || 'No hash found';
    console.log(`Transaction hash: ${txHash}`);
  });

  test('should transfer ERC20 tokens', async () => {
    // Fill out token transfer details (using WETH as an example)
    const tokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH
    await page.locator('#token-address').fill(tokenAddress);
    await page.locator('#token-recipient').fill(testRecipient);
    await page.locator('#token-amount').fill('1');
    
    // Click transfer button
    await page.locator('#token-transfer').click();
    
    // Wait for MetaMask confirmation popup
    await metamask.confirmTransaction();
    
    // Verify transaction was sent
    await expect(page.locator('#transaction-result')).toBeVisible();
    await expect(page.locator('#transaction-result')).toContainText('Token Transfer Initiated');
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-output/token-transaction-result.png' });
  });

  test('should handle rejected transactions', async () => {
    // Fill out transaction details
    await page.locator('#eth-amount').fill('0.001');
    await page.locator('#recipient-address').fill(testRecipient);
    
    // Click send button
    await page.locator('#send-transaction').click();
    
    // Reject the transaction in MetaMask
    await metamask.rejectTransaction();
    
    // Verify error is displayed
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Transaction failed');
    
    // Take screenshot of rejected transaction
    await page.screenshot({ path: 'test-output/transaction-rejected.png' });
  });

  test('should handle invalid input gracefully', async () => {
    // Test with invalid recipient address
    await page.locator('#eth-amount').fill('0.001');
    await page.locator('#recipient-address').fill('0xinvalid');
    
    // Click send button
    await page.locator('#send-transaction').click();
    
    // Verify error is displayed
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Invalid recipient address');
    
    // Take screenshot of error
    await page.screenshot({ path: 'test-output/invalid-address-error.png' });
  });
});

/**
 * SECURITY CONSIDERATIONS:
 * 
 * When testing transaction flows, look for:
 * 1. Clear indication of transaction details before signing
 * 2. Proper validation of input (addresses, amounts)
 * 3. Appropriate error handling
 * 4. Transaction status updates
 * 5. Multiple transaction requests without clear user consent
 * 6. Excessive gas usage or unexpected gas configurations
 */ 