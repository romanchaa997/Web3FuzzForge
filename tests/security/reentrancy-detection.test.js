const { test, expect } = require('@playwright/test');
const { setupMetaMask } = require('../../utils/wallet-setup');
const { interceptTransactions, analyzeTxForReentrancy } = require('../../utils/security-scanners');

test.describe('Reentrancy Vulnerability Detection', () => {
  test('should detect potential reentrancy vulnerabilities', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // Interact with a function that might trigger multiple calls
    await page.locator('#withdraw-funds-button').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze the transaction payload for reentrancy patterns
    const analysisResult = await analyzeTxForReentrancy(page);
    
    // Validate that proper checks are in place
    expect(analysisResult.hasReentrancyProtection).toBeTruthy();
    expect(analysisResult.stateChangesBeforeCalls).toBeTruthy();
    expect(analysisResult.usesReentrancyGuard).toBeTruthy();
  });

  test('should validate state changes occur before external calls', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Setup transaction capture
    await interceptTransactions(page);
    
    // Interact with a function that has external calls
    await page.locator('#transfer-all-button').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze the transaction payload for proper state change ordering
    const txAnalysis = await analyzeTxForReentrancy(page);
    
    // Check if state changes occur before external calls to prevent reentrancy
    expect(txAnalysis.stateChangesBeforeCalls).toBeTruthy();
  });
}); 