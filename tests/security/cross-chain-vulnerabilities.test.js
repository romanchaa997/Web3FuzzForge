const { test, expect } = require('@playwright/test');
const { setupMetaMask } = require('../../utils/wallet-setup');
const { interceptTransactions } = require('../../utils/security-scanners');
const { analyzeForCrossChainVulnerabilities } = require('../../utils/cross-chain-scanners');

test.describe('Cross-Chain Security Vulnerabilities', () => {
  test('should verify secure cross-chain token bridging', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Select source and destination chains
    await page.locator('#source-chain-select').selectOption('ethereum');
    await page.locator('#destination-chain-select').selectOption('polygon');
    
    // Enter amount to bridge
    await page.locator('#bridge-amount').fill('1.0');
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // Click bridge button
    await page.locator('#bridge-tokens-button').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze for cross-chain vulnerabilities
    const analysisResult = await analyzeForCrossChainVulnerabilities(page);
    
    // Check security measures
    expect(analysisResult.usesReliableBridge).toBeTruthy();
    expect(analysisResult.hasTimelock).toBeTruthy();
    expect(analysisResult.verifiedDestinationAddress).toBeTruthy();
  });

  test('should detect insecure cross-chain message passing', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Navigate to cross-chain messaging section
    await page.locator('#cross-chain-messaging-tab').click();
    
    // Setup source and destination
    await page.locator('#message-source-chain').selectOption('ethereum');
    await page.locator('#message-destination-chain').selectOption('arbitrum');
    
    // Enter message payload
    await page.locator('#message-payload').fill('0x1234567890abcdef');
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // Send the message
    await page.locator('#send-cross-chain-message').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze for cross-chain messaging vulnerabilities
    const analysisResult = await analyzeForCrossChainVulnerabilities(page, 'messaging');
    
    // Check security measures specific to messaging
    expect(analysisResult.usesMessageVerification).toBeTruthy();
    expect(analysisResult.hasTamperProofing).toBeTruthy();
    expect(analysisResult.preventsMEVAttacks).toBeTruthy();
  });

  test('should analyze cross-chain relayer security', async ({ page }) => {
    const wallet = await setupMetaMask(page);
    
    // Go to the dApp
    await page.goto(process.env.TARGET_URL || 'http://localhost:3000');
    
    // Connect wallet to the dApp
    await page.locator('#connect-wallet-button').click();
    await wallet.approve();
    
    // Navigate to relayer section
    await page.locator('#cross-chain-relayer-tab').click();
    
    // Setup parameters
    await page.locator('#relayer-source-chain').selectOption('optimism');
    await page.locator('#relayer-destination-chain').selectOption('base');
    
    // Setup transaction interception
    await interceptTransactions(page);
    
    // Trigger relayer action
    await page.locator('#execute-relayer-action').click();
    
    // Approve the transaction
    await wallet.confirmTransaction();
    
    // Analyze for relayer security
    const analysisResult = await analyzeForCrossChainVulnerabilities(page, 'relayer');
    
    // Check relayer security measures
    expect(analysisResult.usesSecureRelayer).toBeTruthy();
    expect(analysisResult.hasRelayerRedundancy).toBeTruthy();
    expect(analysisResult.preventsFrontRunning).toBeTruthy();
  });
}); 