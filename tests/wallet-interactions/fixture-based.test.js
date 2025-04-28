/**
 * Fixture-Based Wallet Tests
 * 
 * This test suite demonstrates using the wallet fixtures for testing.
 */

const { test } = require('../../src/utils/wallet-test-fixtures');
const { expect } = require('@playwright/test');

// Configure all tests to use mock mode for stable testing
test.use({ mockMode: true });

test.describe('Wallet Fixture Tests', () => {
  test('should connect to dApp using wallet fixture', async ({ wallet }) => {
    console.log('Starting wallet fixture test...');
    
    // The wallet fixture gives us a pre-configured wallet
    const DAPP_URL = 'https://app.uniswap.org';
    
    // Use the enhanced methods from our fixture
    console.log(`Connecting to ${DAPP_URL}...`);
    const { page } = await wallet.connectToDapp(DAPP_URL);
    
    // Approve connection (simulation)
    await wallet.approve();
    
    console.log('✅ Wallet fixture connection test completed');
  });
  
  test('should use connectAndApprove convenience method', async ({ wallet }) => {
    console.log('Starting connectAndApprove fixture test...');
    
    const DAPP_URL = 'https://app.uniswap.org';
    
    // Use the convenience method that does multiple steps
    console.log(`Connecting to ${DAPP_URL} with one-line method...`);
    const { page } = await wallet.connectAndApprove(
      DAPP_URL,
      '[data-testid="navbar-connect-wallet"]',
      'text=MetaMask'
    );
    
    console.log('✅ connectAndApprove test completed');
  });
  
  test('should use enhanced transaction signing', async ({ wallet }) => {
    console.log('Starting enhanced transaction signing test...');
    
    const DAPP_URL = 'https://app.uniswap.org';
    
    // Connect and approve
    const { page } = await wallet.connectAndApprove(DAPP_URL);
    
    // Use the enhanced signing with gas options
    console.log('Signing transaction with custom gas settings...');
    await wallet.signTransaction('high');
    
    console.log('✅ Enhanced transaction signing test completed');
  });
}); 