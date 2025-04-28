/**
 * Wallet Setup Utilities
 * 
 * This module provides helper functions for setting up and interacting with
 * Web3 wallets (especially MetaMask) in Playwright tests.
 */

const { chromium } = require('@playwright/test');
const dappeteer = require('@chainsafe/dappeteer');

/**
 * Sets up MetaMask extension and initializes it for testing
 * 
 * @param {Browser} browser - Playwright browser instance
 * @param {Object} options - Setup options
 * @param {boolean} options.monitorAllRequests - Monitor all requests for security testing
 * @param {boolean} options.securityChecks - Enable additional security checks
 * @returns {Object} - MetaMask controller object
 */
async function setupMetaMask(browser, options = {}) {
  // Default options
  const opts = {
    monitorAllRequests: false,
    securityChecks: false,
    ...options
  };

  try {
    // Simulate MetaMask extension using dappeteer
    const metamask = await dappeteer.initializeMetaMask(
      browser,
      {
        seed: process.env.TEST_WALLET_SEED || 'test test test test test test test test test test test junk',
        password: 'password1234',
        hideSeed: true
      }
    );
    
    // Add event handling capabilities
    const eventHandlers = {};
    
    const enhancedMetamask = {
      ...metamask,
      
      // Event handling
      on: (event, handler) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
      },
      
      emit: (event, data) => {
        if (eventHandlers[event]) {
          for (const handler of eventHandlers[event]) {
            handler(data);
          }
        }
      },
      
      // Enhanced transaction confirmation with security checks
      confirmTransaction: async () => {
        if (opts.securityChecks) {
          // Get transaction details for security analysis
          const txDetails = await enhancedMetamask.getTransactionDetails();
          
          // Check for common security issues
          checkTransactionSecurity(txDetails);
        }
        
        // Confirm the transaction
        await metamask.confirmTransaction();
        
        // Emit transaction event
        if (opts.monitorAllRequests) {
          enhancedMetamask.emit('transaction', { 
            type: 'transaction',
            confirmed: true,
            timestamp: Date.now()
          });
        }
      },
      
      // Reject transaction with monitoring
      rejectTransaction: async () => {
        await metamask.rejectTransaction();
        
        if (opts.monitorAllRequests) {
          enhancedMetamask.emit('transaction', { 
            type: 'transaction',
            confirmed: false,
            rejected: true,
            timestamp: Date.now()
          });
        }
      },
      
      // Enhanced signature confirmation
      confirmSignature: async () => {
        if (opts.securityChecks) {
          // Get signature details for security analysis
          const sigDetails = await enhancedMetamask.getSignatureDetails();
          
          // Check for security issues in the signature request
          checkSignatureSecurity(sigDetails);
        }
        
        // Confirm the signature
        await metamask.confirmSignatureRequest();
        
        if (opts.monitorAllRequests) {
          enhancedMetamask.emit('signature', { 
            type: 'signature',
            confirmed: true,
            timestamp: Date.now()
          });
        }
      },
      
      // Reject signature with monitoring
      rejectSignature: async () => {
        await metamask.rejectSignatureRequest();
        
        if (opts.monitorAllRequests) {
          enhancedMetamask.emit('signature', { 
            type: 'signature',
            confirmed: false,
            rejected: true,
            timestamp: Date.now()
          });
        }
      },
      
      // Get transaction details (mock implementation)
      getTransactionDetails: async () => {
        // In a real implementation, this would extract details from the MetaMask UI
        // For this example, we'll return mock data
        return {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a',
          gas: '0x30d40',
          gasPrice: '0x4a817c800'
        };
      },
      
      // Get signature details (mock implementation)
      getSignatureDetails: async () => {
        // In a real implementation, this would extract details from the MetaMask UI
        return {
          type: 'personal_sign',
          data: 'Test message for Web3 Security Testing'
        };
      },
      
      // Check if there's an active transaction prompt
      hasTransactionPrompt: async () => {
        // This is a mock implementation
        // In a real implementation, this would check the MetaMask UI
        return Math.random() > 0.5; // Randomly return true/false for demo
      },
      
      // Simulate wallet disconnection
      disconnectWallet: async () => {
        // This is a mock implementation
        // In a real implementation, this would trigger the wallet disconnect
        enhancedMetamask.emit('disconnect', { timestamp: Date.now() });
        return true;
      }
    };
    
    return enhancedMetamask;
  } catch (error) {
    console.error('Failed to setup MetaMask:', error);
    throw error;
  }
}

/**
 * Helper function to connect wallet to dApp
 * 
 * @param {Page} page - Playwright page object
 * @param {Object} metamask - MetaMask controller object
 * @returns {Promise<void>}
 */
async function connectWallet(page, metamask) {
  try {
    // Click the connect button
    await page.locator('#connect-wallet').click();
    
    // Handle the connection request in MetaMask
    await metamask.approve();
    
    // Wait for the connection to be established
    await page.waitForSelector('#wallet-info:not(.hidden)');
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Check transaction for security issues
 * 
 * @param {Object} txDetails - Transaction details
 */
function checkTransactionSecurity(txDetails) {
  // Check for unlimited approvals
  if (txDetails.data && txDetails.data.startsWith('0x095ea7b3')) {
    // This is an ERC20 approve function signature
    if (txDetails.data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
      console.warn('⚠️ SECURITY WARNING: Unlimited token approval detected');
    }
  }
  
  // Check for suspiciously high gas price
  if (txDetails.gasPrice && parseInt(txDetails.gasPrice, 16) > 100000000000) {
    console.warn('⚠️ SECURITY WARNING: Unusually high gas price detected');
  }
  
  // Log the transaction for security analysis
  console.log('Security check - Transaction details:', JSON.stringify(txDetails, null, 2));
}

/**
 * Check signature request for security issues
 * 
 * @param {Object} sigDetails - Signature details
 */
function checkSignatureSecurity(sigDetails) {
  // Check for potentially malicious signature types
  if (sigDetails.type === 'eth_sign') {
    console.warn('⚠️ SECURITY WARNING: Using eth_sign is discouraged as it can sign arbitrary data');
  }
  
  // Check for potential phishing content in messages
  const phishingTerms = ['private key', 'seed', 'password', 'send', 'transfer'];
  if (sigDetails.data && typeof sigDetails.data === 'string') {
    for (const term of phishingTerms) {
      if (sigDetails.data.toLowerCase().includes(term)) {
        console.warn(`⚠️ SECURITY WARNING: Potentially suspicious term in signature request: "${term}"`);
      }
    }
  }
  
  // Log the signature request for security analysis
  console.log('Security check - Signature details:', JSON.stringify(sigDetails, null, 2));
}

module.exports = {
  setupMetaMask,
  connectWallet
}; 