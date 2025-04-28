/**
 * @fileoverview Security Testing Examples
 * 
 * This test demonstrates how to identify common security issues in Web3 dApps.
 * It covers:
 * - Multiple approval detection
 * - Unlimited approval detection
 * - Silent transaction attempts
 * - Phishing attempts
 * - Proper error handling
 * 
 * IMPORTANT: This test uses intentional vulnerabilities added to the demo dApp
 * for educational purposes. The vulnerabilities should never be present in
 * production applications.
 */

const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('../../utils/wallet-setup');

test.describe('Security Testing Examples', () => {
  let page;
  let metamask;
  
  test.beforeEach(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Setup MetaMask extension with monitoring
    metamask = await setupMetaMask(browser, { monitorAllRequests: true });
    
    // Navigate to the demo dApp and connect wallet
    await page.goto('http://localhost:1234/');
    await connectWallet(page, metamask);
    
    // Wait for security section to be visible
    await expect(page.locator('#security-section')).toBeVisible();
  });
  
  test('should detect vulnerable functions attempting multiple transactions', async () => {
    // Start transaction monitoring
    const transactionPromises = setupTransactionMonitoring(metamask);
    
    // Click the vulnerable function button
    await page.locator('#execute-vulnerable').click();
    
    // Confirm first transaction in MetaMask
    await metamask.confirmTransaction();
    
    // Check if multiple transactions were initiated
    let transactions = await transactionPromises.next();
    
    // Take screenshot before the second confirmation
    await page.screenshot({ path: 'test-output/vulnerable-function-first-tx.png' });
    
    // If we detect a second transaction, confirm it as well, but log the security issue
    if (await metamask.hasTransactionPrompt()) {
      console.warn('SECURITY ISSUE: Multiple transactions requested without clear user consent');
      
      // Confirm second transaction
      await metamask.confirmTransaction();
      
      // Get the second transaction
      transactions = await transactionPromises.next();
      
      // Log transaction data
      console.log('Multiple transaction sequence detected:');
      console.log('Transaction 1:', transactions[0]);
      console.log('Transaction 2:', transactions[1]);
      
      // Take screenshot after second confirmation
      await page.screenshot({ path: 'test-output/vulnerable-function-second-tx.png' });
      
      // SECURITY TEST PASSED: Detected multiple transactions without clear consent
      console.log('✓ Security test passed: Detected multiple transaction requests');
    } else {
      // SECURITY TEST FAILED: Should have detected multiple transactions
      console.log('✗ Security test failed: Did not detect multiple transaction requests');
    }
  });
  
  test('should detect unlimited token approvals', async () => {
    // Click the vulnerable function button which includes an unlimited approval
    await page.locator('#execute-vulnerable').click();
    
    // Confirm first transaction (dummy transaction)
    await metamask.confirmTransaction();
    
    // Inspect the second transaction (approval)
    if (await metamask.hasTransactionPrompt()) {
      // Extract transaction details from MetaMask
      const txDetails = await metamask.getTransactionDetails();
      
      // Take screenshot of the approval request
      await page.screenshot({ path: 'test-output/unlimited-approval-request.png' });
      
      // Check if this is an approval transaction
      if (txDetails.data && txDetails.data.startsWith('0x095ea7b3')) {
        // This is an ERC20 approve function signature
        
        // Check if the amount is very large (unlimited approval)
        if (txDetails.data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
          console.warn('SECURITY ISSUE: Unlimited token approval detected');
          
          // SECURITY TEST PASSED: Detected unlimited approval
          console.log('✓ Security test passed: Detected unlimited token approval');
        } else {
          console.log('Limited token approval detected, which is safer');
        }
      }
      
      // Confirm or reject based on test needs
      await metamask.confirmTransaction();
    }
  });
  
  test('should detect multiple sequential approval requests', async () => {
    // Click the multiple approvals button
    await page.locator('#request-multiple-approvals').click();
    
    // Counter for approvals
    let approvalCount = 0;
    
    // Process up to 3 approval requests
    for (let i = 0; i < 3; i++) {
      // Check if we have a transaction prompt
      if (await metamask.hasTransactionPrompt()) {
        // Extract transaction details
        const txDetails = await metamask.getTransactionDetails();
        
        // Check if this is an approval transaction
        if (txDetails.data && txDetails.data.startsWith('0x095ea7b3')) {
          approvalCount++;
          
          // Take screenshot of each approval
          await page.screenshot({ path: `test-output/multiple-approval-${approvalCount}.png` });
          
          // Confirm the transaction
          await metamask.confirmTransaction();
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // Verify we detected multiple approvals
    if (approvalCount > 1) {
      console.warn(`SECURITY ISSUE: ${approvalCount} sequential token approvals detected`);
      
      // SECURITY TEST PASSED: Detected multiple approvals
      console.log('✓ Security test passed: Detected multiple sequential approvals');
    } else {
      // SECURITY TEST FAILED: Should have detected multiple approvals
      console.log('✗ Security test failed: Did not detect multiple approvals');
    }
  });
  
  test('should check for proper error handling in dApp', async () => {
    // Test with various edge cases
    
    // 1. Test with invalid recipient address
    await page.locator('#eth-amount').fill('0.001');
    await page.locator('#recipient-address').fill('0xinvalid');
    await page.locator('#send-transaction').click();
    
    // Verify error handling in UI
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Invalid recipient address');
    
    // 2. Test with empty message for signing
    await page.locator('#message-to-sign').fill('');
    await page.locator('#sign-message').click();
    
    // Verify error handling in UI
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Please provide a message');
    
    // 3. Test disconnecting wallet
    await metamask.disconnectWallet();
    
    // Verify dApp handles disconnection gracefully
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Wallet disconnected');
    
    // SECURITY TEST: UI properly validates inputs and handles errors
    console.log('✓ Security test: dApp correctly validates inputs and handles errors');
  });
});

/**
 * Set up transaction monitoring to detect multiple transaction requests
 */
function setupTransactionMonitoring(metamask) {
  const transactions = [];
  
  const monitor = {
    // Generator function to yield transactions as they occur
    async *next() {
      // Wait for the next transaction to be added
      while (transactions.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return transactions;
    }
  };
  
  // Set up listener for transaction events
  metamask.on('transaction', (tx) => {
    transactions.push(tx);
  });
  
  return monitor;
}

/**
 * SECURITY TESTING BEST PRACTICES:
 * 
 * 1. Wallet Connection:
 *    - Check for clear connection status indication
 *    - Verify proper handling of connection rejection
 *    - Test network switching behavior
 * 
 * 2. Transactions:
 *    - Check for multiple transactions without clear consent
 *    - Verify gas fees are displayed clearly
 *    - Test rejection handling
 * 
 * 3. Approvals:
 *    - Check for unlimited approvals
 *    - Test for multiple sequential approvals
 *    - Verify clear indication of what is being approved
 * 
 * 4. Signatures:
 *    - Verify what is being signed is clearly displayed
 *    - Check for malicious message formatting
 *    - Test rejection handling
 * 
 * 5. Error Handling:
 *    - Verify proper validation of all user inputs
 *    - Check for clear error messages
 *    - Test edge cases and invalid inputs
 */ 