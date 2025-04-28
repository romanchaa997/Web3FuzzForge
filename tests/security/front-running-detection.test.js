const { test, expect } = require('@playwright/test');
const { setupMetaMask } = require('../../utils/wallet-setup');
const { interceptTransactions, detectFrontRunningVulnerabilities } = require('../../utils/security-scanners');

test.describe('Front-Running Vulnerability Detection', () => {
  test('should check for front-running protection in high-value transactions', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // Interact with a high-value transaction function
    await page.locator('#swap-tokens-button').click();
    
    // Fill in large amount to test with
    await page.locator('#amount-input').fill('1000');
    
    // Click the submit button
    await page.locator('#submit-swap-button').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze the transaction for front-running vulnerabilities
    const analysisResult = await detectFrontRunningVulnerabilities(page);
    
    // Check that proper protection is in place
    expect(analysisResult.hasFrontRunningProtection).toBeTruthy();
    
    // Log any specific vulnerabilities found
    if (analysisResult.vulnerabilityDetails.length > 0) {
      console.warn('Front-running vulnerabilities detected:', analysisResult.vulnerabilityDetails);
    }
  });

  test('should verify commit-reveal pattern for sensitive operations', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // For operations that should use commit-reveal pattern (like bidding)
    // First step: commit
    await page.locator('#place-bid-button').click();
    
    // Fill in bid details
    await page.locator('#bid-amount-input').fill('10');
    await page.locator('#bid-hash-input').fill('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    
    // Submit commit
    await page.locator('#submit-bid-button').click();
    await wallet.confirmTransaction();
    
    // Analyze if commit-reveal pattern is used
    const analysisResult = await detectFrontRunningVulnerabilities(page);
    
    // Check specifically for commit-reveal pattern
    expect(analysisResult.usesCommitReveal).toBeTruthy();
  });
}); 