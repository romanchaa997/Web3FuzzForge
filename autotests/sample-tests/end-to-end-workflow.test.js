/**
 * @fileoverview Complex End-to-End Web3 Workflow Test
 * 
 * This test demonstrates a comprehensive end-to-end testing scenario
 * that combines multiple Web3 interactions in sequence, representing
 * a realistic user journey through a dApp.
 * 
 * The test covers:
 * 1. Wallet connection
 * 2. Network validation
 * 3. Token approval
 * 4. ETH transaction
 * 5. Message signing
 * 6. Security checks throughout the flow
 */

const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('../../utils/wallet-setup');
const { ethers } = require('ethers');

test.describe('End-to-End Web3 Workflow', () => {
  let page;
  let metamask;
  const testRecipient = '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1'; // Example test address
  
  test.beforeEach(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Setup MetaMask extension with monitoring for security issues
    metamask = await setupMetaMask(browser, { 
      monitorAllRequests: true,
      securityChecks: true
    });
    
    // Navigate to the demo dApp
    await page.goto('http://localhost:1234/');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-output/e2e-initial-state.png' });
  });
  
  test('complete end-to-end user journey with security validation', async () => {
    console.log('🔄 Starting end-to-end workflow test');
    
    // STEP 1: Connect wallet and verify connection
    console.log('Step 1: Connecting wallet');
    await connectWallet(page, metamask);
    
    // Verify wallet connection was successful
    await expect(page.locator('#wallet-info')).toBeVisible();
    const walletAddress = await page.locator('#wallet-address').textContent();
    const chainId = await page.locator('#chain-id').textContent();
    console.log(`Connected wallet: ${walletAddress} on chain: ${chainId}`);
    
    // Take screenshot after connection
    await page.screenshot({ path: 'test-output/e2e-connected.png' });
    
    // STEP 2: Security check - verify we're on the expected network
    console.log('Step 2: Verifying network');
    // Check we're on a test network for safety
    const networkName = await page.locator('#network-name').textContent();
    const isTestnet = ['goerli', 'sepolia', 'rinkeby', 'ropsten', 'kovan', 'mumbai'].some(
      net => networkName.toLowerCase().includes(net)
    );
    
    if (!isTestnet) {
      console.warn('⚠️ SECURITY WARNING: Test running on mainnet or unknown network');
    } else {
      console.log(`✓ Verified running on testnet: ${networkName}`);
    }
    
    // STEP 3: Send an ETH transaction
    console.log('Step 3: Sending ETH transaction');
    await page.locator('#eth-amount').fill('0.001');
    await page.locator('#recipient-address').fill(testRecipient);
    await page.locator('#send-transaction').click();
    
    // Security check - examine transaction details before confirming
    const txDetails = await metamask.getTransactionDetails();
    console.log('Transaction details:', JSON.stringify(txDetails, null, 2));
    
    // Check gas price isn't abnormally high as a security precaution
    if (txDetails.gasPrice && parseInt(txDetails.gasPrice, 16) > 100000000000) {
      console.warn('⚠️ SECURITY WARNING: Unusually high gas price detected');
    }
    
    // Confirm the transaction
    await metamask.confirmTransaction();
    
    // Verify transaction was sent successfully
    await expect(page.locator('#transaction-result')).toBeVisible();
    await expect(page.locator('#transaction-result')).toContainText('Transaction Sent');
    
    // Take screenshot after ETH transaction
    await page.screenshot({ path: 'test-output/e2e-eth-transaction.png' });
    
    // Extract and store the transaction hash
    const txResultText = await page.locator('#transaction-result').textContent();
    const txHashMatch = txResultText.match(/0x[a-fA-F0-9]{64}/);
    const txHash = txHashMatch ? txHashMatch[0] : 'No hash found';
    console.log(`ETH transaction hash: ${txHash}`);
    
    // STEP 4: Execute a token transfer
    console.log('Step 4: Token transfer');
    // Set token transfer details
    await page.locator('#token-recipient').fill(testRecipient);
    await page.locator('#token-amount').fill('1');
    await page.locator('#token-transfer').click();
    
    // Security check - Inspect token transaction details
    const tokenTxDetails = await metamask.getTransactionDetails();
    
    // Check if this is a proper token transfer (function signature for transfer: 0xa9059cbb)
    if (tokenTxDetails.data && tokenTxDetails.data.startsWith('0xa9059cbb')) {
      console.log('✓ Verified correct ERC20 transfer function signature');
    } else {
      console.warn('⚠️ SECURITY WARNING: Unexpected function call in token transaction');
    }
    
    // Confirm the token transaction
    await metamask.confirmTransaction();
    
    // Verify token transaction was sent
    await expect(page.locator('#transaction-result')).toBeVisible();
    await expect(page.locator('#transaction-result')).toContainText('Token Transfer Initiated');
    
    // Take screenshot after token transaction
    await page.screenshot({ path: 'test-output/e2e-token-transaction.png' });
    
    // STEP 5: Sign a message
    console.log('Step 5: Message signing');
    // Define a test message that includes some context to prevent phishing
    const testMessage = `Web3 Security Test: Verification message for ${walletAddress} at ${new Date().toISOString()}`;
    
    // Fill in the message
    await page.locator('#message-to-sign').fill(testMessage);
    await page.locator('#sign-message').click();
    
    // Security check - verify the message content in MetaMask matches what we expect
    const messageDetails = await metamask.getSignatureDetails();
    
    // Verify the message matches what we intended to sign
    if (messageDetails && messageDetails.data === testMessage) {
      console.log('✓ Verified message to sign matches expected content');
    } else {
      console.warn('⚠️ SECURITY WARNING: Message content mismatch');
    }
    
    // Confirm the signature
    await metamask.confirmSignature();
    
    // Verify signature result
    await expect(page.locator('#signature-result')).toBeVisible();
    await expect(page.locator('#signature-result')).toContainText('Message Signed');
    
    // Take screenshot after message signing
    await page.screenshot({ path: 'test-output/e2e-message-signed.png' });
    
    // STEP 6: Test a security-sensitive function
    console.log('Step 6: Security test - Vulnerable function');
    
    // Start transaction monitoring
    const transactionPromises = setupTransactionMonitoring(metamask);
    
    // Click the vulnerable function button
    await page.locator('#execute-vulnerable').click();
    
    // Confirm first transaction
    await metamask.confirmTransaction();
    
    // Check if multiple transactions were requested
    if (await metamask.hasTransactionPrompt()) {
      console.warn('⚠️ SECURITY VULNERABILITY: Multiple transactions requested without clear user consent');
      
      // Inspect the second transaction before confirming
      const secondTxDetails = await metamask.getTransactionDetails();
      
      // Check if this is an approval transaction
      if (secondTxDetails.data && secondTxDetails.data.startsWith('0x095ea7b3')) {
        // Check approval amount
        if (secondTxDetails.data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
          console.warn('⚠️ SECURITY VULNERABILITY: Unlimited token approval requested');
        }
      }
      
      // For testing purposes, we'll confirm this, but in a real security test
      // we might want to reject suspicious transactions
      await metamask.confirmTransaction();
      
      // Get the transactions that were monitored
      const transactions = await transactionPromises.next();
      console.log(`Detected ${transactions.length} transactions in sequence`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-output/e2e-complete.png' });
    
    console.log('✅ End-to-end workflow test completed successfully');
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
 * COMPREHENSIVE END-TO-END TESTING BEST PRACTICES:
 * 
 * 1. Create realistic user journeys that test full workflows
 * 2. Include security checks at each step
 * 3. Validate UI state transitions throughout the process
 * 4. Check transaction and signature details before confirming
 * 5. Verify correct error handling in all steps
 * 6. Monitor for suspicious patterns like multiple requests
 * 7. Validate network and connection details for security
 * 8. Save detailed logs and screenshots for traceability
 * 9. Include both positive and negative test paths
 * 10. Verify proper event handling throughout the flow
 */ 