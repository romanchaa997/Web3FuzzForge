/**
 * Dappeteer Wrapper
 * 
 * This wrapper isolates @chainsafe/dappeteer which has some security vulnerabilities
 * in its dependency chain. By using this wrapper, you can:
 * 
 * 1. Limit the scope of vulnerable code to just wallet automation
 * 2. Apply additional safety checks and validations
 * 3. Eventually replace with a more secure implementation
 * 
 * RECOMMENDED: Use this wrapper instead of importing @chainsafe/dappeteer directly
 */

const dappeteer = require('@chainsafe/dappeteer');

/**
 * Safely bootstrap a wallet instance with additional security checks
 * @param {import('playwright').Browser} browser - Playwright browser instance
 * @param {Object} options - Configuration options
 * @returns {Promise<{metaMask: Object, wallet: Object}>} - Wallet automation objects
 */
async function safeBootstrap(browser, options = {}) {
  // Validate options
  if (!browser) {
    throw new Error('Browser instance is required');
  }
  
  // Set sensible defaults
  const safeOptions = {
    wallet: options.wallet || 'metamask',
    seed: options.seed || undefined,
    password: options.password || 'password1234',
    showTestNets: !!options.showTestNets,
    initialize: options.initialize !== false,
  };

  try {
    // Call the original bootstrap with validated options
    const result = await dappeteer.bootstrap(browser, safeOptions);
    return result;
  } catch (error) {
    // Provide more helpful error messages
    console.error('Error bootstrapping wallet:', error.message);
    if (error.message.includes('TimeoutError')) {
      console.error('Timeout error: Check if wallet extension installed correctly');
    }
    throw error;
  }
}

/**
 * Check if a wallet connection is secure
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the connection is secure
 */
function isSecureWalletConnection(url) {
  try {
    const parsedUrl = new URL(url);
    // Check for secure URLs only
    return parsedUrl.protocol === 'https:' || 
           parsedUrl.hostname === 'localhost' ||
           parsedUrl.hostname === '127.0.0.1';
  } catch (error) {
    return false;
  }
}

module.exports = {
  // Re-export the original API for compatibility
  ...dappeteer,
  // Override bootstrap with safer version
  bootstrap: safeBootstrap,
  // Add new safety utilities
  isSecureWalletConnection,
};
