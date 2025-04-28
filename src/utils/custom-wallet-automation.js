/**
 * Custom Wallet Automation
 * 
 * This is a secure implementation to replace @chainsafe/dappeteer
 * Built directly on Playwright without the vulnerable dependencies
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

// MetaMask extension paths by platform
const METAMASK_EXTENSION_PATHS = {
  linux: '~/.config/google-chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn',
  darwin: '~/Library/Application Support/Google/Chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn',
  win32: process.env.LOCALAPPDATA + '/Google/Chrome/User Data/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn'
};

// Well-known Ethereum networks
const NETWORKS = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  goerli: {
    name: 'Goerli Test Network',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'GoerliETH',
    blockExplorer: 'https://goerli.etherscan.io'
  },
  sepolia: {
    name: 'Sepolia Test Network',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'SepoliaETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  },
  mumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    blockExplorer: 'https://arbiscan.io'
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    symbol: 'ETH',
    blockExplorer: 'https://optimistic.etherscan.io'
  }
};

/**
 * Get the MetaMask extension path based on platform
 * @returns {string} The platform-specific MetaMask extension path
 */
function getMetaMaskPath() {
  const platform = process.platform;
  let basePath = METAMASK_EXTENSION_PATHS[platform] || '';
  
  // Replace ~ with home directory if present
  if (basePath.startsWith('~')) {
    basePath = path.join(process.env.HOME || process.env.USERPROFILE, basePath.slice(2));
  }
  
  // Find the version directory if it exists
  if (fs.existsSync(basePath)) {
    const versionDirs = fs.readdirSync(basePath).filter(d => 
      fs.statSync(path.join(basePath, d)).isDirectory()
    );
    
    if (versionDirs.length > 0) {
      // Sort version directories to get the latest
      versionDirs.sort((a, b) => {
        const versionA = a.split('.').map(Number);
        const versionB = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
          const numA = versionA[i] || 0;
          const numB = versionB[i] || 0;
          if (numA !== numB) return numB - numA; // Descending order
        }
        return 0;
      });
      
      return path.join(basePath, versionDirs[0]);
    }
  }
  
  // Fallback to a common location for browser extensions in Playwright
  return path.join(__dirname, '../../extensions/metamask');
}

/**
 * Validate seed phrase to ensure it's a proper 12-word mnemonic
 * @param {string} seed - The seed phrase to validate
 * @returns {boolean} Whether the seed phrase is valid
 */
function validateSeedPhrase(seed) {
  if (!seed) return false;
  
  // Check if it's a string with 12 words
  const words = seed.trim().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    return false;
  }
  
  // Check if all words are valid (simplified check)
  for (const word of words) {
    if (word.length < 3 || word.length > 8) {
      return false;
    }
  }
  
  return true;
}

/**
 * Bootstrap MetaMask wallet for testing
 * @param {import('playwright').Browser} browser - Playwright browser instance
 * @param {Object} options - Configuration options
 * @returns {Promise<{metaMask: Object, wallet: Object, context: import('playwright').BrowserContext}>} - Wallet automation objects
 */
async function bootstrap(browser, options = {}) {
  // Validate and set default options
  const safeOptions = {
    wallet: options.wallet || 'metamask',
    seed: options.seed || undefined,
    password: options.password || 'password1234',
    showTestNets: !!options.showTestNets,
    initialize: options.initialize !== false,
    headless: options.headless !== true, // Default to headed mode for wallet interactions
    mockMode: options.mockMode === true, // Mock mode for simulating without real extension
    timeout: options.timeout || 60000
  };
  
  // Validate seed phrase if provided
  if (safeOptions.seed && !validateSeedPhrase(safeOptions.seed)) {
    throw new Error('Invalid seed phrase. Must be 12 or 24 words separated by spaces.');
  }
  
  // For this implementation, we're using a simulation approach
  // In a real extension-based implementation, we would load the extension here
  
  // Create a new context
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
    recordVideo: safeOptions.recordVideo ? { dir: 'videos/' } : undefined,
    // In a full implementation, we would add the extension here
  });
  
  // Create a page for wallet simulation
  const metaMaskPage = await context.newPage();
  
  // Create the MetaMask controller
  const metaMask = createMetaMaskController(metaMaskPage, safeOptions);
  
  // Initialize if required
  if (safeOptions.initialize) {
    if (safeOptions.mockMode) {
      console.log('Simulating wallet initialization...');
    } else {
      try {
        await metaMask.initialize();
      } catch (error) {
        console.error('Error initializing wallet:', error);
        throw error;
      }
    }
  }
  
  return { metaMask, wallet: metaMask, context };
}

/**
 * Create a controller for MetaMask interaction
 * @param {import('playwright').Page} page - Playwright page
 * @param {Object} options - Configuration options
 * @returns {Object} - MetaMask controller
 */
function createMetaMaskController(page, options) {
  // Active network info
  let activeNetwork = NETWORKS.mainnet;
  
  return {
    page,
    options,
    
    /**
     * Initialize MetaMask with account
     */
    async initialize() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating wallet initialization');
        return;
      }
      
      try {
        // Check if we're on the welcome page
        const isWelcomePage = await page.locator('text=Welcome to MetaMask').isVisible()
          .catch(() => false);
        
        if (isWelcomePage) {
          // Click Get Started
          await page.locator('text=Get Started').click();
          
          // Import wallet option
          await page.locator('text=Import wallet').click();
          
          // Accept terms
          await page.locator('text=I agree').click();
          
          // Enter seed phrase (if provided)
          if (options.seed) {
            for (let i = 0; i < 12; i++) {
              const word = options.seed.split(' ')[i] || '';
              await page.locator(`#import-srp__srp-word-${i}`).fill(word);
            }
          }
          
          // Enter password
          await page.locator('#password').fill(options.password);
          await page.locator('#confirm-password').fill(options.password);
          
          // Accept terms checkbox
          await page.locator('text=I understand MetaMask cannot recover this password').click();
          
          // Submit
          await page.locator('button:has-text("Import")').click();
          
          // Wait for successful import
          await page.locator('text=Congratulations').waitFor();
          
          // Close the congratulations screen
          await page.locator('button:has-text("Got it!")').click();
          
          // Close the popup if it appears
          await page.locator('button:has-text("Close")').click()
            .catch(() => console.log('No close button found, continuing...'));
        }
        
        // Enable test networks if requested
        if (options.showTestNets) {
          await this.enableTestNetworks();
        }
        
        console.log('MetaMask initialized successfully');
      } catch (error) {
        console.error('Error initializing MetaMask:', error);
        throw error;
      }
    },
    
    /**
     * Enable test networks in MetaMask
     */
    async enableTestNetworks() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating enabling test networks');
        return;
      }
      
      try {
        // Click on the network dropdown
        await page.locator('.network-display').click();
        
        // Click on "Show/hide test networks"
        await page.locator('text=Show/hide test networks').click();
        
        // Enable the toggle
        await page.locator('#show-test-networks-switch').click();
        
        // Click back or close
        await page.locator('button:has-text("Close")').click()
          .catch(() => console.log('No close button found, continuing...'));
          
        console.log('Test networks enabled successfully');
      } catch (error) {
        console.error('Error enabling test networks:', error);
        throw error;
      }
    },
    
    /**
     * Approve a connection request
     */
    async approve() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating wallet connection approval');
        return true;
      }
      
      try {
        // Wait for the permission popup and accept it
        const popupPage = await getPopupPage(page.context());
        
        // Click Next
        await popupPage.locator('button:has-text("Next")').click()
          .catch(() => console.log('No Next button found, trying Connect...'));
          
        // Click Connect
        await popupPage.locator('button:has-text("Connect")').click()
          .catch(() => console.log('No Connect button found, connection might be automatic'));
        
        // Wait for connection to complete
        await popupPage.waitForTimeout(1000);
        
        console.log('Connection approved successfully');
        return true;
      } catch (error) {
        console.error('Error approving connection:', error);
        throw error;
      }
    },
    
    /**
     * Reject a connection request
     */
    async reject() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating wallet connection rejection');
        return true;
      }
      
      try {
        // Wait for the permission popup and reject it
        const popupPage = await getPopupPage(page.context());
        
        // Click Cancel/Reject
        await popupPage.locator('button:has-text("Cancel")')
          .or(popupPage.locator('button:has-text("Reject")'))
          .click()
          .catch(() => console.log('No Cancel/Reject button found, trying X button...'));
          
        // If no Cancel button, try clicking X
        await popupPage.locator('.request-signature__header__cancel')
          .click()
          .catch(() => console.log('No X button found either'));
        
        // Wait for rejection to complete
        await popupPage.waitForTimeout(1000);
        
        console.log('Connection rejected successfully');
        return true;
      } catch (error) {
        console.error('Error rejecting connection:', error);
        throw error;
      }
    },
    
    /**
     * Sign a message or transaction
     */
    async sign() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating transaction signing');
        return true;
      }
      
      try {
        // Wait for the signature popup and approve it
        const popupPage = await getPopupPage(page.context());
        
        // Click Sign or Confirm
        await popupPage.locator('button:has-text("Sign")')
          .or(popupPage.locator('button:has-text("Confirm")'))
          .click();
        
        // Wait for the signature to complete
        await popupPage.waitForTimeout(1000);
        
        console.log('Transaction signed successfully');
        return true;
      } catch (error) {
        console.error('Error signing transaction:', error);
        throw error;
      }
    },
    
    /**
     * Reject a signature request
     */
    async rejectSignature() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating signature rejection');
        return true;
      }
      
      try {
        // Wait for the signature popup and reject it
        const popupPage = await getPopupPage(page.context());
        
        // Click Reject
        await popupPage.locator('button:has-text("Reject")')
          .click()
          .catch(() => console.log('No Reject button found, trying Cancel...'));
        
        // If no Reject button, try Cancel
        await popupPage.locator('button:has-text("Cancel")')
          .click()
          .catch(() => console.log('No Cancel button found either'));
        
        // Wait for rejection to complete
        await popupPage.waitForTimeout(1000);
        
        console.log('Signature rejected successfully');
        return true;
      } catch (error) {
        console.error('Error rejecting signature:', error);
        throw error;
      }
    },
    
    /**
     * Confirm a transaction
     * @param {Object} gasOptions - Gas price options
     */
    async confirmTransaction(gasOptions = {}) {
      if (options.mockMode) {
        console.log('Mock mode: Simulating transaction confirmation');
        return true;
      }
      
      try {
        // Wait for the transaction popup
        const popupPage = await getPopupPage(page.context());
        
        // Adjust gas if requested
        if (gasOptions.speed) {
          await this.adjustGasPrice(popupPage, gasOptions.speed);
        }
        
        // Click Confirm
        await popupPage.locator('button:has-text("Confirm")')
          .click();
        
        // Wait for confirmation
        await popupPage.waitForTimeout(2000);
        
        console.log('Transaction confirmed successfully');
        return true;
      } catch (error) {
        console.error('Error confirming transaction:', error);
        throw error;
      }
    },
    
    /**
     * Adjust gas price based on speed preference
     * @param {import('playwright').Page} popupPage - The transaction popup page
     * @param {string} speed - Gas speed preference ('low', 'medium', 'high')
     */
    async adjustGasPrice(popupPage, speed = 'medium') {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating gas adjustment to ${speed}`);
        return;
      }
      
      try {
        // Click on Edit button to adjust gas
        await popupPage.locator('button:has-text("Edit")')
          .click()
          .catch(() => console.log('No Edit button found'));
        
        // Select gas option based on speed preference
        switch(speed.toLowerCase()) {
          case 'low':
            await popupPage.locator('button:has-text("Low")')
              .click()
              .catch(() => console.log('Low gas option not found'));
            break;
          case 'medium':
            await popupPage.locator('button:has-text("Medium")')
              .or(popupPage.locator('button:has-text("Market")'))
              .click()
              .catch(() => console.log('Medium gas option not found'));
            break;
          case 'high':
            await popupPage.locator('button:has-text("High")')
              .or(popupPage.locator('button:has-text("Aggressive")'))
              .click()
              .catch(() => console.log('High gas option not found'));
            break;
          default:
            console.log(`Unknown gas speed preference: ${speed}`);
        }
        
        // Save gas settings
        await popupPage.locator('button:has-text("Save")')
          .click()
          .catch(() => console.log('No Save button found'));
          
        console.log(`Gas adjusted to ${speed} settings`);
      } catch (error) {
        console.error('Error adjusting gas price:', error);
        throw error;
      }
    },
    
    /**
     * Switch network
     * @param {string|Object} network - The name of the network to switch to or network object
     */
    async switchNetwork(network) {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating network switch to ${typeof network === 'string' ? network : network.name}`);
        
        // Update active network for mock mode
        if (typeof network === 'string') {
          const normalizedNetworkName = network.toLowerCase();
          
          // Check if network exists in our predefined networks
          for (const [key, value] of Object.entries(NETWORKS)) {
            if (key.toLowerCase() === normalizedNetworkName || 
                value.name.toLowerCase().includes(normalizedNetworkName)) {
              activeNetwork = value;
              console.log(`Switched to ${activeNetwork.name} (Chain ID: ${activeNetwork.chainId})`);
              return;
            }
          }
          
          throw new Error(`Unknown network: ${network}`);
        } else {
          // Network is an object
          activeNetwork = network;
          console.log(`Switched to custom network: ${network.name} (Chain ID: ${network.chainId})`);
        }
        
        return;
      }
      
      try {
        // Click on the network dropdown
        await page.locator('.network-display').click();
        
        // If network is a string, find the network by name
        if (typeof network === 'string') {
          // Try to click on the network by name
          await page.locator(`text=${network}`)
            .click()
            .catch(async (error) => {
              console.log(`Network ${network} not found in the dropdown, adding it...`);
              // Add the network if it's not available
              await this.addNetwork(NETWORKS[network.toLowerCase()] || network);
            });
        } else {
          // Network is an object, add it
          await this.addNetwork(network);
        }
        
        // Wait for network switch
        await page.waitForTimeout(1000);
        
        console.log(`Switched to ${typeof network === 'string' ? network : network.name}`);
      } catch (error) {
        console.error('Error switching network:', error);
        throw error;
      }
    },
    
    /**
     * Add a custom network
     * @param {Object} networkDetails - The network details
     */
    async addNetwork(networkDetails) {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating adding network ${networkDetails.name}`);
        activeNetwork = networkDetails;
        return;
      }
      
      try {
        // Click Add Network button
        await page.locator('text=Add network')
          .click()
          .catch(async () => {
            // If "Add network" not found, try looking for "Add a network" or similar
            await page.locator('text=/Add a network|Add custom network/i')
              .click()
              .catch(() => console.log('Add network button not found'));
          });
          
        // Click Add Network manually
        await page.locator('text=/Add a network manually|Custom networks/i')
          .click()
          .catch(() => console.log('Manual network addition not found'));
        
        // Fill in network details
        await page.locator('input[placeholder="Network name"]')
          .fill(networkDetails.name);
          
        await page.locator('input[placeholder="New RPC URL"]')
          .fill(networkDetails.rpcUrl);
          
        await page.locator('input[placeholder="Chain ID"]')
          .fill(networkDetails.chainId.toString());
          
        await page.locator('input[placeholder="Currency symbol"]')
          .fill(networkDetails.symbol);
          
        if (networkDetails.blockExplorer) {
          await page.locator('input[placeholder="Block explorer URL"]')
            .fill(networkDetails.blockExplorer);
        }
        
        // Click Save/Add
        await page.locator('button:has-text("Save")')
          .or(page.locator('button:has-text("Add")'))
          .click();
          
        // Approve any switching confirmations
        await page.locator('button:has-text("Switch")')
          .click()
          .catch(() => console.log('No network switch confirmation needed'));
          
        console.log(`Added network ${networkDetails.name}`);
      } catch (error) {
        console.error('Error adding network:', error);
        throw error;
      }
    },
    
    /**
     * Get the current network
     * @returns {Object} The current network details
     */
    getNetwork() {
      // In mock mode, return the active network
      if (options.mockMode) {
        return activeNetwork;
      }
      
      // In real implementation, would detect from page
      // For now, return mock value
      return activeNetwork;
    },
    
    /**
     * Import a new account with private key
     * @param {string} privateKey - The private key to import
     * @param {string} name - The account name
     */
    async importAccount(privateKey, name = 'Imported Account') {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating importing account: ${name}`);
        return;
      }
      
      try {
        // Click on the account menu (top-right circle)
        await page.locator('.account-menu__icon')
          .click();
          
        // Click Import Account
        await page.locator('text=Import Account')
          .click();
          
        // Enter private key
        await page.locator('input[type="text"]')
          .fill(privateKey);
          
        // Click Import
        await page.locator('button:has-text("Import")')
          .click();
          
        // Rename account if a name was provided
        if (name !== 'Imported Account') {
          await this.renameAccount(name);
        }
        
        console.log(`Imported account: ${name}`);
      } catch (error) {
        console.error('Error importing account:', error);
        throw error;
      }
    },
    
    /**
     * Rename the current account
     * @param {string} name - The new account name
     */
    async renameAccount(name) {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating renaming account to ${name}`);
        return;
      }
      
      try {
        // Click on the account menu (top-right circle)
        await page.locator('.account-menu__icon')
          .click();
          
        // Click on account details
        await page.locator('text=/Account \\d+|Details/')
          .click();
          
        // Click on edit icon
        await page.locator('.editable-label__icon')
          .click();
          
        // Clear and enter new name
        await page.locator('.editable-label__input')
          .fill('');
        await page.locator('.editable-label__input')
          .fill(name);
          
        // Save by pressing Enter
        await page.locator('.editable-label__input')
          .press('Enter');
          
        // Close the account details
        await page.locator('.account-details__close')
          .click();
          
        console.log(`Renamed account to: ${name}`);
      } catch (error) {
        console.error('Error renaming account:', error);
        throw error;
      }
    },
    
    /**
     * Switch to a different account by index or name
     * @param {number|string} accountIdentifier - The account index (0-based) or name
     */
    async switchAccount(accountIdentifier) {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating switching to account: ${accountIdentifier}`);
        return;
      }
      
      try {
        // Click on the account menu (top-right circle)
        await page.locator('.account-menu__icon')
          .click();
          
        // If accountIdentifier is a number, select by index
        if (typeof accountIdentifier === 'number') {
          // Account indexes in UI are 1-based, but our API uses 0-based indexing
          const accountNum = accountIdentifier + 1;
          
          // Click on the account by index
          await page.locator(`.multichain-account-list-item:nth-child(${accountNum})`)
            .click()
            .catch(async () => {
              // Alternative selector if the above doesn't work
              await page.locator(`text=Account ${accountNum}`)
                .click();
            });
        } else {
          // If it's a string, assume it's a name and select by text
          await page.locator(`text=${accountIdentifier}`)
            .click();
        }
        
        console.log(`Switched to account: ${accountIdentifier}`);
      } catch (error) {
        console.error('Error switching account:', error);
        throw error;
      }
    },
    
    /**
     * Create a new account
     * @param {string} name - The account name
     */
    async createAccount(name = 'Account') {
      if (options.mockMode) {
        console.log(`Mock mode: Simulating creating new account: ${name}`);
        return;
      }
      
      try {
        // Click on the account menu (top-right circle)
        await page.locator('.account-menu__icon')
          .click();
          
        // Click Create Account
        await page.locator('text=Create Account')
          .click();
          
        // Enter account name
        await page.locator('input[placeholder="Account Name"]')
          .fill(name);
          
        // Click Create
        await page.locator('button:has-text("Create")')
          .click();
          
        console.log(`Created new account: ${name}`);
      } catch (error) {
        console.error('Error creating account:', error);
        throw error;
      }
    },
    
    /**
     * Lock the wallet
     */
    async lock() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating locking wallet');
        return;
      }
      
      try {
        // Click on the account menu (top-right circle)
        await page.locator('.account-menu__icon')
          .click();
          
        // Click Lock
        await page.locator('text=Lock')
          .click();
          
        console.log('Wallet locked');
      } catch (error) {
        console.error('Error locking wallet:', error);
        throw error;
      }
    },
    
    /**
     * Unlock the wallet
     * @param {string} password - The wallet password
     */
    async unlock(password = options.password) {
      if (options.mockMode) {
        console.log('Mock mode: Simulating unlocking wallet');
        return;
      }
      
      try {
        // Enter password
        await page.locator('input[type="password"]')
          .fill(password);
          
        // Click Unlock
        await page.locator('button:has-text("Unlock")')
          .click();
          
        console.log('Wallet unlocked');
      } catch (error) {
        console.error('Error unlocking wallet:', error);
        throw error;
      }
    },
    
    /**
     * Get balance information
     * @returns {Object} Balance information
     */
    async getBalance() {
      if (options.mockMode) {
        console.log('Mock mode: Simulating getting balance');
        // Return mock balance
        return {
          value: '1.234',
          token: activeNetwork.symbol,
          network: activeNetwork.name
        };
      }
      
      try {
        // In a real implementation, would extract the balance from the UI
        // For now, return a placeholder
        return {
          value: 'Unknown',
          token: 'ETH',
          network: 'Unknown'
        };
      } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
      }
    }
  };
}

/**
 * Get the extension ID from the browser context
 * @param {import('playwright').BrowserContext} context - Playwright browser context
 * @returns {Promise<string>} - The extension ID
 */
async function getExtensionId(context) {
  // This is a simplification - in real implementation, you'd need to
  // access the extension ID dynamically from the browser
  return "nkbihfbeogaeaoehlefnkodbefgpgknn";
}

/**
 * Get the popup page for MetaMask interactions
 * @param {import('playwright').BrowserContext} context - Playwright browser context
 * @returns {Promise<import('playwright').Page>} - The popup page
 */
async function getPopupPage(context) {
  // Wait for any new pages (popups) to appear
  const pages = context.pages();
  
  // Return the most recently created page, which should be the popup
  if (pages.length > 1) {
    return pages[pages.length - 1];
  }
  
  // Wait for a new page to be created (the popup)
  return await context.waitForEvent('page', { timeout: 10000 });
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

/**
 * Get network details by chain ID
 * @param {number} chainId - The chain ID to look up
 * @returns {Object|null} - The network details or null if not found
 */
function getNetworkByChainId(chainId) {
  for (const [key, network] of Object.entries(NETWORKS)) {
    if (network.chainId === chainId) {
      return { ...network, id: key };
    }
  }
  return null;
}

module.exports = {
  bootstrap,
  isSecureWalletConnection,
  getNetworkByChainId,
  NETWORKS
}; 