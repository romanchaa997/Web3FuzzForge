/**
 * Phantom Wallet Testing Utilities
 *
 * Helper functions for interacting with Phantom wallet in Playwright tests.
 */

const { expect } = require('@playwright/test')

/**
 * Set up Phantom wallet for testing
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Setup options
 * @param {string} options.network - Network to use (mainnet, testnet, devnet)
 * @param {string} options.accountName - Name for the test account
 * @returns {Promise<void>}
 */
async function setupPhantomWallet(page, options = {}) {
  console.log('Setting up Phantom wallet for testing...')

  const network = options.network || 'devnet'
  const accountName = options.accountName || 'Test Wallet'

  // Inject Phantom mock if in test environment
  await page.evaluate(network => {
    // Create a mock Phantom provider if not already available
    if (!window.solana) {
      console.log(`Creating mock Phantom provider (${network})`)

      // Create test account keys
      const testAccount = {
        publicKey: new Uint8Array([
          3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0,
        ]),
        secretKey: new Uint8Array(64).fill(1),
      }

      // Convert public key to base58 for display
      // eslint-disable-next-line no-inner-declarations
      function toBase58(arr) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
        const base = alphabet.length
        let carry
        const digits = [0]

        for (let i = 0; i < arr.length; i++) {
          carry = arr[i]
          for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8
            digits[j] = carry % base
            carry = (carry / base) | 0
          }
          while (carry > 0) {
            digits.push(carry % base)
            carry = (carry / base) | 0
          }
        }

        let result = ''
        for (let k = 0; k < digits.length; k++) {
          result = alphabet[digits[k]] + result
        }
        return result
      }

      const publicKeyBase58 = toBase58(testAccount.publicKey)

      // Mock Solana/Phantom provider
      window.solana = {
        isPhantom: true,
        publicKey: { toString: () => publicKeyBase58 },
        isConnected: false,
        autoApprove: true,
        connect: async function () {
          this.isConnected = true
          return { publicKey: this.publicKey }
        },
        disconnect: async function () {
          this.isConnected = false
          return true
        },
        signTransaction: async function (transaction) {
          console.log('Mock signing transaction:', transaction)
          return transaction
        },
        signAllTransactions: async function (transactions) {
          console.log('Mock signing multiple transactions:', transactions)
          return transactions
        },
        signMessage: async function (message) {
          console.log('Mock signing message:', message)
          const signature = new Uint8Array(64).fill(2)
          return { signature }
        },
        request: async function (params) {
          console.log('Phantom request:', params)

          if (params.method === 'connect') {
            this.isConnected = true
            return { publicKey: this.publicKey }
          } else if (params.method === 'disconnect') {
            this.isConnected = false
            return true
          } else if (params.method === 'wallet_switchEthereumChain') {
            return true
          }

          return true
        },
      }

      // Dispatch connect event for dApps that listen for it
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('solana#initialized', { detail: window.solana }))
      }, 100)
    }
  }, network)

  // Wait to ensure Phantom mock is initialized
  await page.waitForTimeout(500)

  console.log('Phantom wallet setup complete')
}

/**
 * Connect Phantom wallet to the dApp
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string>} - Connected account address
 */
async function connectPhantomWallet(page) {
  console.log('Connecting Phantom wallet to dApp...')

  // Check if connection popup appears and handle it
  const popupPromise = page.waitForEvent('popup', { timeout: 10000 }).catch(() => null)

  // Wait for Phantom popup or continue if not found
  const popup = await popupPromise

  if (popup) {
    console.log('Phantom popup detected, handling connection approval')

    // Click the "Connect" or "Approve" button in the popup
    await popup
      .locator('button:has-text("Connect"), button:has-text("Approve"), button:has-text("Confirm")')
      .first()
      .click({ timeout: 10000 })
      .catch(async err => {
        console.log('Error finding connect button in popup:', err)
        // Try common fallback elements
        await popup
          .locator('.connect-button, .approve-button, .confirm-button')
          .first()
          .click({ timeout: 5000 })
          .catch(() => {
            console.log('Failed to find any connect button, trying to press Enter key')
            return popup.keyboard.press('Enter')
          })
      })

    // Wait for the popup to close
    await popup.waitForEvent('close', { timeout: 10000 }).catch(() => {
      console.log('Timeout waiting for popup to close')
    })
  } else {
    // If no popup, assume connection is handled within the page
    console.log('No popup detected, assuming in-page connection flow')

    // Try to handle in-page connection dialog
    await page
      .locator('.phantom-connect-button, button:has-text("Connect"), button:has-text("Approve")')
      .first()
      .click({ timeout: 5000 })
      .catch(() => {
        console.log('No in-page connect button found, connection may be automatic')
      })
  }

  // Wait for connection to complete
  await page.waitForTimeout(2000)

  // Get the connected account address if possible
  const connectedAddress = await page
    .evaluate(() => {
      return window.solana?.publicKey?.toString() || ''
    })
    .catch(() => '')

  console.log(`Connected with Phantom address: ${connectedAddress}`)

  return connectedAddress
}

/**
 * Disconnect Phantom wallet from the dApp
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 */
async function disconnectPhantomWallet(page) {
  console.log('Disconnecting Phantom wallet...')

  // Look for disconnect button in common locations
  const disconnectButton = page
    .locator('[data-testid="disconnect-button"], button:has-text("Disconnect"), .disconnect-button')
    .first()

  // Click disconnect if found
  await disconnectButton.click({ timeout: 5000 }).catch(async () => {
    console.log('Disconnect button not found in main UI, trying wallet dropdown')

    // Try clicking wallet address/icon first to show dropdown
    await page
      .locator('[data-testid="wallet-button"], .wallet-button, .account-button')
      .first()
      .click({ timeout: 5000 })
      .catch(() => {
        console.log('Wallet button not found, trying alternative disconnect method')
      })

    // Now try to find disconnect in dropdown
    await page
      .locator('text=Disconnect, button:has-text("Disconnect")')
      .first()
      .click({ timeout: 5000 })
      .catch(async () => {
        console.log('Still no disconnect option found, trying programmatic disconnect')

        // Fallback to programmatic disconnect
        await page.evaluate(() => {
          if (window.solana && typeof window.solana.disconnect === 'function') {
            return window.solana.disconnect()
          }
          return false
        })
      })
  })

  // Wait for disconnect to process
  await page.waitForTimeout(1000)

  console.log('Phantom wallet disconnected')
}

/**
 * Approve a transaction request in Phantom wallet
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string>} - Transaction hash or empty string if not found
 */
async function approvePhantomTransaction(page) {
  console.log('Approving Phantom transaction...')

  // Wait for transaction popup
  const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null)
  const popup = await popupPromise

  let txHash = ''

  if (popup) {
    console.log('Transaction popup detected')

    // Wait for popup to load
    await popup.waitForLoadState('networkidle')

    // Look for transaction details if needed
    txHash = await popup
      .locator('.transaction-hash, [data-testid="tx-hash"]')
      .textContent()
      .catch(() => '')

    // Click the approve button
    await popup
      .locator(
        'button:has-text("Approve"), button:has-text("Confirm"), button:has-text("Sign"), .approve-button, .confirm-button, .sign-button'
      )
      .first()
      .click({ timeout: 10000 })
      .catch(async err => {
        console.log('Error finding approve button:', err)
        // Try fallback approach - press Enter key
        await popup.keyboard.press('Enter')
      })

    // Wait for popup to close
    await popup.waitForEvent('close', { timeout: 20000 }).catch(() => {
      console.log('Timeout waiting for transaction popup to close')
    })
  } else {
    // If no popup, look for in-page approval elements
    console.log('No transaction popup detected, looking for in-page approval')

    await page
      .locator(
        'button:has-text("Approve"), button:has-text("Confirm"), button:has-text("Sign"), .approve-button, .confirm-button'
      )
      .first()
      .click({ timeout: 5000 })
      .catch(async () => {
        console.log('No in-page approve button found, trying programmatic approval')

        // Try programmatic approval as fallback
        txHash = await page
          .evaluate(() => {
            if (window.solana && window.solana._handlePendingTransaction) {
              return window.solana._handlePendingTransaction('approve')
            }
            return ''
          })
          .catch(() => '')
      })
  }

  // Wait for transaction processing
  await page.waitForTimeout(3000)

  console.log('Transaction approved')
  return txHash
}

/**
 * Setup wallet state with specific options
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Wallet state options
 * @returns {Promise<Object>} - Saved wallet state
 */
async function setupPhantomWalletState(page, options = {}) {
  // Setup the wallet with options
  await setupPhantomWallet(page, options)

  // Connect to establish initial state
  await connectPhantomWallet(page)

  // Save the current state
  const state = await page.evaluate(() => {
    return {
      isConnected: window.solana?.isConnected || false,
      publicKey: window.solana?.publicKey?.toString() || '',
      network: window.solana?.network || 'devnet',
      autoApprove: window.solana?.autoApprove || false,
    }
  })

  // Add any custom state data
  return {
    ...state,
    ...options,
    timestamp: Date.now(),
  }
}

/**
 * Save current wallet state
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} customData - Additional data to include in state
 * @returns {Promise<Object>} - Saved wallet state
 */
async function savePhantomWalletState(page, customData = {}) {
  const state = await page.evaluate(() => {
    return {
      isConnected: window.solana?.isConnected || false,
      publicKey: window.solana?.publicKey?.toString() || '',
      network: window.solana?.network || 'devnet',
      autoApprove: window.solana?.autoApprove || false,
    }
  })

  return {
    ...state,
    ...customData,
    timestamp: Date.now(),
  }
}

/**
 * Restore a previously saved wallet state
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} state - Previously saved wallet state
 * @returns {Promise<void>}
 */
async function restorePhantomWalletState(page, state) {
  await page.evaluate(state => {
    if (!window.solana) {
      console.error('Cannot restore Phantom wallet state: window.solana is not defined')
      return false
    }

    // Restore connection state
    window.solana.isConnected = state.isConnected || false
    window.solana.autoApprove = state.autoApprove || false

    // Restore network if needed
    if (state.network && window.solana.network !== state.network) {
      console.log(`Restoring network to ${state.network}`)
      window.solana.network = state.network
    }

    // Dispatch appropriate events
    if (state.isConnected) {
      window.dispatchEvent(
        new CustomEvent('solana#connect', { detail: { publicKey: window.solana.publicKey } })
      )
    }

    return true
  }, state)

  // Wait for state to be applied
  await page.waitForTimeout(500)

  console.log('Phantom wallet state restored:', state.isConnected ? 'Connected' : 'Disconnected')
}

module.exports = {
  setupPhantomWallet,
  connectPhantomWallet,
  disconnectPhantomWallet,
  approvePhantomTransaction,
  setupPhantomWalletState,
  savePhantomWalletState,
  restorePhantomWalletState,
}
