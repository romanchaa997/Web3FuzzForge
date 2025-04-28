/**
 * Wallet Test Fixtures for Playwright
 * 
 * This file provides fixtures for easy integration of wallet automation
 * with Playwright tests.
 */

const { test: base } = require('@playwright/test');
const walletAutomation = require('./custom-wallet-automation');

// Define default options
const DEFAULT_OPTIONS = {
  seed: 'test test test test test test test test test test test junk',
  password: 'password1234',
  showTestNets: false,
  mockMode: false // Default to real mode, not mock mode
};

// Create fixtures extending Playwright's test object
const test = base.extend({
  // Add mockMode as a fixture that can be overridden
  mockMode: [false, { option: true }],
  
  /**
   * Fixture that provides a wallet instance
   * @param {Object} param0 - Parameters
   * @param {import('playwright').Browser} param0.browser - Playwright browser
   * @param {boolean} param0.mockMode - Whether to use mock mode
   * @param {Function} use - Function to use the fixture
   */
  wallet: async ({ browser, mockMode }, use) => {
    // Set up wallet automation with options
    const options = { ...DEFAULT_OPTIONS, mockMode };
    
    // Bootstrap the wallet
    const { metaMask, context } = await walletAutomation.bootstrap(browser, options);
    
    // Define a convenient object with all wallet functionality
    const wallet = {
      // Include all metaMask methods
      ...metaMask,
      
      // Add context for page creation
      context,
      
      // Add enhanced functionality
      async connectToDapp(url) {
        // Security check
        if (!walletAutomation.isSecureWalletConnection(url)) {
          console.warn('⚠️ Warning: Connecting to a non-secure URL. In production, only use https:// URLs.');
        }
        
        // Create page and navigate
        const page = await context.newPage();
        
        if (!mockMode) {
          // Only actually navigate if not in mock mode
          await page.goto(url);
        } else {
          console.log(`Mock mode: Simulating navigation to ${url}`);
        }
        
        return { page };
      },
      
      // Convenience method for connect and approve flow
      async connectAndApprove(url, clickConnectSelector = '[data-testid="navbar-connect-wallet"]', clickWalletSelector = null) {
        const { page } = await this.connectToDapp(url);
        
        if (!mockMode) {
          // Only try to click buttons if not in mock mode
          // Click connect button if provided
          if (clickConnectSelector) {
            await page.click(clickConnectSelector).catch(e => {
              console.log(`Could not click connect button with selector "${clickConnectSelector}": ${e.message}`);
            });
          }
          
          // Click wallet option if provided
          if (clickWalletSelector) {
            await page.click(clickWalletSelector).catch(e => {
              console.log(`Could not click wallet option with selector "${clickWalletSelector}": ${e.message}`);
            });
          }
        } else {
          console.log(`Mock mode: Simulating clicking connect and wallet selection`);
        }
        
        // Approve connection
        await this.approve();
        
        return { page };
      },
      
      // Enhanced transaction signing with gas adjustment
      async signTransaction(gasOption = 'default') {
        console.log(`Signing transaction with ${gasOption} gas settings...`);
        
        if (mockMode) {
          console.log(`Mock mode: Simulating transaction signing with ${gasOption} gas settings`);
          return true;
        }
        
        // In real implementation, would adjust gas settings
        // For now, use the basic sign method
        await metaMask.sign();
        
        return true;
      }
    };
    
    // Call the use function with the wallet object
    await use(wallet);
    
    // Cleanup after use
    await context.close();
  }
});

// Export the enhanced test object and original walletAutomation module
module.exports = {
  test,
  walletAutomation
}; 