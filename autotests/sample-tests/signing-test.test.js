/**
 * @fileoverview Message Signing Test
 * 
 * This test demonstrates how to test signing functionality in a dApp.
 * It covers:
 * - Basic message signing
 * - EIP-712 typed data signing
 * - Signature verification
 * - Handling rejection scenarios
 */

const { test, expect } = require('@playwright/test');
const { setupMetaMask, connectWallet } = require('../../utils/wallet-setup');
const { ethers } = require('ethers');

test.describe('Message Signing Tests', () => {
  let page;
  let metamask;
  
  test.beforeEach(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Setup MetaMask extension
    metamask = await setupMetaMask(browser);
    
    // Navigate to the demo dApp and connect wallet
    await page.goto('http://localhost:1234/');
    await connectWallet(page, metamask);
    
    // Wait for signing section to be visible
    await expect(page.locator('#signing-section')).toBeVisible();
  });
  
  test('should sign a message', async () => {
    // Define test message
    const testMessage = 'Test message for Web3 Security Testing';
    
    // Fill in the message
    await page.locator('#message-to-sign').fill(testMessage);
    
    // Take screenshot before signing
    await page.screenshot({ path: 'test-output/message-signing-before.png' });
    
    // Click sign button
    await page.locator('#sign-message').click();
    
    // Confirm signing in MetaMask
    await metamask.confirmSignature();
    
    // Verify signature appears in result
    await expect(page.locator('#signature-result')).toBeVisible();
    await expect(page.locator('#signature-result')).toContainText('Message Signed');
    await expect(page.locator('#signature-result')).toContainText(testMessage);
    
    // Extract signature for verification
    const resultText = await page.locator('#signature-result').textContent();
    const signatureMatch = resultText.match(/Signature: (0x[a-fA-F0-9]+)/);
    const signature = signatureMatch ? signatureMatch[1] : null;
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-output/message-signing-result.png' });
    
    // Verify signature validity (if available)
    if (signature) {
      // Extract signer address
      const signerMatch = resultText.match(/Signer: (0x[a-fA-F0-9]+)/);
      const signer = signerMatch ? signerMatch[1] : null;
      
      // Log for verification
      console.log(`Message: ${testMessage}`);
      console.log(`Signature: ${signature}`);
      console.log(`Signer: ${signer}`);
      
      // Verify signature (if we have the signer address)
      if (signer) {
        const recoveredAddress = ethers.verifyMessage(testMessage, signature);
        console.log(`Recovered signer: ${recoveredAddress}`);
        console.log(`Signature valid: ${recoveredAddress.toLowerCase() === signer.toLowerCase()}`);
      }
    }
  });
  
  test('should sign typed data (EIP-712)', async () => {
    // Click the sign typed data button
    await page.locator('#sign-typed-data').click();
    
    // Confirm signing in MetaMask
    await metamask.confirmSignature();
    
    // Verify signature appears in result
    await expect(page.locator('#signature-result')).toBeVisible();
    await expect(page.locator('#signature-result')).toContainText('Typed Data Signed');
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-output/typed-data-signing-result.png' });
    
    // Extract signature for reporting
    const resultText = await page.locator('#signature-result').textContent();
    const signatureMatch = resultText.match(/Signature: (0x[a-fA-F0-9]+)/);
    const signature = signatureMatch ? signatureMatch[1] : 'No signature found';
    
    console.log(`EIP-712 Signature: ${signature}`);
  });
  
  test('should handle rejection of signature request', async () => {
    // Fill in a message
    await page.locator('#message-to-sign').fill('Message that will be rejected');
    
    // Click sign button
    await page.locator('#sign-message').click();
    
    // Reject signing in MetaMask
    await metamask.rejectSignature();
    
    // Verify error is displayed
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Signing failed');
    
    // Take screenshot of error
    await page.screenshot({ path: 'test-output/signature-rejected.png' });
  });
  
  test('should not proceed if no message provided', async () => {
    // Clear the message field
    await page.locator('#message-to-sign').fill('');
    
    // Click sign button
    await page.locator('#sign-message').click();
    
    // Verify error is displayed without MetaMask interaction
    await expect(page.locator('#error-result')).toBeVisible();
    await expect(page.locator('#error-result')).toContainText('Please provide a message');
    
    // Take screenshot of error
    await page.screenshot({ path: 'test-output/empty-message-error.png' });
  });
});

/**
 * SECURITY CONSIDERATIONS:
 * 
 * When testing signing flows, look for:
 * 1. Clear indication of what is being signed
 * 2. Protection against malicious message formatting
 * 3. Proper formatting of EIP-712 data
 * 4. No sensitive data in signed messages
 * 5. No blind signing of transactions disguised as messages
 * 6. Appropriate error handling
 */ 