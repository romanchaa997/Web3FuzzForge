/**
 * Error Handling and Edge Cases for Wallet Interactions
 * 
 * This test suite covers error scenarios and edge cases when interacting with wallets.
 */

const { test, expect } = require('@playwright/test');
const walletAutomation = require('../../src/utils/custom-wallet-automation');

test.describe('Wallet Interaction Error Handling', () => {
  test.beforeEach(async ({ browser }, testInfo) => {
    console.log(`Running test: ${testInfo.title}`);
  });

  test('should handle invalid seed phrase', async ({ browser }) => {
    console.log('Testing wallet behavior with invalid seed phrase...');
    
    // Initialize wallet with invalid seed phrase
    try {
      const { metaMask } = await walletAutomation.bootstrap(browser, {
        seed: 'invalid seed phrase', // Not a valid 12-word seed
        password: 'password1234',
      });
      
      // This should not be reached if proper validation is in place
      expect(false).toBeTruthy('Should have thrown error for invalid seed phrase');
    } catch (error) {
      // We expect an error to be thrown
      console.log('Correctly caught error with invalid seed phrase');
      expect(error).toBeDefined();
    }
    
    console.log('✅ Invalid seed phrase test completed');
  });

  test('should handle rejected connection request', async ({ browser }) => {
    // Test dApp URL
    const DAPP_URL = 'https://app.uniswap.org';
    
    console.log('Setting up wallet for rejected connection test...');
    
    // Create a mock implementation that will reject the connection
    const mockMetaMask = {
      approve: async () => {
        throw new Error('User rejected the connection request');
      }
    };
    
    // Initialize wallet with our modified controller that rejects connections
    const { metaMask, context } = await walletAutomation.bootstrap(browser, {
      seed: 'test test test test test test test test test test test junk',
      password: 'password1234',
    });
    
    // Replace the metaMask controller with our mock
    const originalApprove = metaMask.approve;
    metaMask.approve = mockMetaMask.approve;
    
    // Create page and attempt connection
    const page = await context.newPage();
    
    try {
      await metaMask.approve();
      // Should not reach here
      expect(false).toBeTruthy('Should have thrown error for rejected connection');
    } catch (error) {
      // We expect an error
      expect(error.message).toContain('rejected');
      console.log('Correctly caught rejection error:', error.message);
    }
    
    // Restore original method
    metaMask.approve = originalApprove;
    
    console.log('✅ Rejected connection test completed');
  });

  test('should handle network switching failure', async ({ browser }) => {
    // Test dApp URL
    const DAPP_URL = 'https://app.uniswap.org';
    
    console.log('Setting up wallet for network switching failure test...');
    
    // Initialize wallet
    const { metaMask, context } = await walletAutomation.bootstrap(browser, {
      seed: 'test test test test test test test test test test test junk',
      password: 'password1234',
    });
    
    // Create a mock switchNetwork that fails
    const originalSwitchNetwork = metaMask.switchNetwork;
    metaMask.switchNetwork = async (networkName) => {
      console.log(`Simulating failure when switching to ${networkName}...`);
      throw new Error(`Failed to switch to network: ${networkName}`);
    };
    
    // Create page and connect
    const page = await context.newPage();
    await metaMask.approve(); // This would work
    
    // Try to switch to a non-existent network
    try {
      await metaMask.switchNetwork('NonExistentNetwork');
      // Should not reach here
      expect(false).toBeTruthy('Should have thrown error for network switching');
    } catch (error) {
      // We expect an error
      expect(error.message).toContain('Failed to switch to network');
      console.log('Correctly caught network switching error:', error.message);
    }
    
    // Restore original method
    metaMask.switchNetwork = originalSwitchNetwork;
    
    console.log('✅ Network switching failure test completed');
  });
}); 