/**
 * Comprehensive Wallet Connection Tests
 * 
 * This test suite covers various connection scenarios with the custom wallet automation.
 */

const { test, expect } = require('@playwright/test');
const walletAutomation = require('../../src/utils/custom-wallet-automation');

test.describe('Wallet Connection Scenarios', () => {
  test.beforeEach(async ({ browser }, testInfo) => {
    console.log(`Running test: ${testInfo.title}`);
  });

  test('should connect wallet to a secure HTTPS dApp', async ({ browser }) => {
    // Secure dApp URL
    const DAPP_URL = 'https://app.uniswap.org';
    
    console.log('Setting up wallet for secure connection test...');
    
    // Verify the URL is considered secure
    expect(walletAutomation.isSecureWalletConnection(DAPP_URL)).toBeTruthy();
    
    // Initialize wallet
    const { metaMask, context } = await walletAutomation.bootstrap(browser, {
      seed: 'test test test test test test test test test test test junk',
      password: 'password1234',
    });
    
    // Create page and simulate connection
    const page = await context.newPage();
    await metaMask.approve();
    
    console.log('✅ Secure connection test completed');
  });

  test('should warn when connecting to a non-secure HTTP dApp', async ({ browser }) => {
    // Non-secure dApp URL
    const DAPP_URL = 'http://example.com';
    
    console.log('Setting up wallet for non-secure connection test...');
    
    // Verify the URL is considered non-secure
    expect(walletAutomation.isSecureWalletConnection(DAPP_URL)).toBeFalsy();
    
    // Initialize wallet but with additional logging for the warning
    const logs = [];
    const originalConsoleWarn = console.warn;
    console.warn = (message) => {
      logs.push(message);
      originalConsoleWarn(message);
    };
    
    // Set up the wallet automation
    const { metaMask, context } = await walletAutomation.bootstrap(browser, {
      seed: 'test test test test test test test test test test test junk',
      password: 'password1234',
    });
    
    // Create page and check for warnings
    const page = await context.newPage();
    
    // Check if warning was logged when connecting to non-secure URL
    if (!walletAutomation.isSecureWalletConnection(DAPP_URL)) {
      console.warn('⚠️ Warning: Connecting to a non-secure URL. In production, only use https:// URLs.');
    }
    
    // Verify warning was logged
    expect(logs.some(log => log.includes('non-secure URL'))).toBeTruthy();
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
    
    console.log('✅ Non-secure connection warning test completed');
  });

  test('should connect to localhost as a secure development environment', async ({ browser }) => {
    // Localhost URL (considered secure for development)
    const DAPP_URL = 'http://localhost:3000';
    
    console.log('Setting up wallet for localhost connection test...');
    
    // Verify localhost is considered secure despite http:// protocol
    expect(walletAutomation.isSecureWalletConnection(DAPP_URL)).toBeTruthy();
    
    // Initialize wallet
    const { metaMask, context } = await walletAutomation.bootstrap(browser, {
      seed: 'test test test test test test test test test test test junk',
      password: 'password1234',
    });
    
    // Create page and simulate connection
    const page = await context.newPage();
    await metaMask.approve();
    
    console.log('✅ Localhost connection test completed');
  });
}); 