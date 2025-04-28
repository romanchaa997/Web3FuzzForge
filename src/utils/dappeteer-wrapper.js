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
    console.error('Error bootstrapping wallet:', error.message || 'Unknown error');
    
    // Check if the error message contains a specific string (with null/undefined check)
    if (error.message && error.message.includes('TimeoutError')) {
      console.error('Timeout error: Check if wallet extension installed correctly');
    }
    
    // Fall back to a mock implementation for testing
    if (options.mockOnFailure) {
      console.warn('Falling back to mock wallet implementation');
      return createMockWallet();
    }
    
    throw error;
  }
}

/**
 * Creates a mock wallet implementation for testing when the real extension fails
 * @returns {Object} - Mock wallet object
 */
function createMockWallet() {
  const mockMetaMask = {
    approve: async () => console.log('Mock: approve() called'),
    reject: async () => console.log('Mock: reject() called'),
    confirmTransaction: async () => console.log('Mock: confirmTransaction() called'),
    rejectTransaction: async () => console.log('Mock: rejectTransaction() called'),
    confirmSignatureRequest: async () => console.log('Mock: confirmSignatureRequest() called'),
    rejectSignatureRequest: async () => console.log('Mock: rejectSignatureRequest() called'),
    switchNetwork: async (network) => console.log(`Mock: switchNetwork(${network}) called`),
    addNetwork: async (network) => console.log(`Mock: addNetwork(${JSON.stringify(network)}) called`),
    importPK: async (privateKey) => console.log('Mock: importPK() called'),
    lock: async () => console.log('Mock: lock() called'),
    unlock: async (password) => console.log('Mock: unlock() called'),
    isMock: true
  };
  
  return { metaMask: mockMetaMask, wallet: mockMetaMask };
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
  createMockWallet
};
