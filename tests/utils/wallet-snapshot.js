/**
 * Wallet State Snapshot Utilities
 *
 * Functions for capturing and restoring wallet state during tests.
 */

/**
 * Saves the current state of a wallet
 * @param {Object} page - Playwright page object
 * @param {Object} customData - Any custom data to associate with this state
 * @returns {Object} The wallet state object
 */
async function saveWalletState(page, customData = {}) {
  try {
    const state = await page.evaluate(() => {
      if (!window.ethereum) {
        console.error('No wallet detected')
        return null
      }

      // Get UI state
      const uiState = {
        walletInfoVisible: document.getElementById('wallet-info')?.style.display !== 'none',
        walletAddressText: document.querySelector('.wallet-address')?.textContent || null,
        networkNameText: document.getElementById('network-name')?.textContent || null,
      }

      return {
        selectedAddress: window.ethereum?.selectedAddress || null,
        chainId: window.ethereum?.chainId || '0x1',
        networkVersion: window.ethereum?.networkVersion || '1',
        uiState,
      }
    })

    if (!state) {
      console.warn('Failed to save wallet state, received null from page evaluation')
      return null
    }

    return {
      ...state,
      customData,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error saving wallet state:', error)
    return null
  }
}

/**
 * Restores a previously saved wallet state
 * @param {Object} page - Playwright page object
 * @param {Object} state - The wallet state object to restore
 * @returns {Promise<boolean>} Whether the restoration was successful
 */
async function restoreWalletState(page, state) {
  if (!state) {
    throw new Error('Cannot restore null or undefined wallet state')
  }

  try {
    const success = await page.evaluate(state => {
      if (!window.ethereum) {
        console.error('No ethereum object found during wallet state restoration')
        return false
      }

      // Restore ethereum provider state
      window.ethereum.selectedAddress = state.selectedAddress
      window.ethereum.chainId = state.chainId
      if (state.networkVersion) {
        window.ethereum.networkVersion = state.networkVersion
      }

      // Update UI to reflect restored state - independent of provider
      updateUI()

      function updateUI() {
        // Update wallet info display
        const walletInfo = document.getElementById('wallet-info')
        if (walletInfo) {
          walletInfo.style.display = state.selectedAddress ? 'block' : 'none'
        }

        // Update wallet address
        const addressEl = document.querySelector('.wallet-address')
        if (addressEl && state.selectedAddress) {
          addressEl.textContent = state.selectedAddress
        }

        // Update network name
        const networkNames = {
          '0x1': 'Ethereum Mainnet',
          '0x5': 'Goerli Testnet',
          '0x89': 'Polygon Mainnet',
        }

        const networkEl = document.getElementById('network-name')
        if (networkEl && state.chainId) {
          networkEl.textContent = networkNames[state.chainId] || `Chain ID: ${state.chainId}`
        }
      }

      return true
    }, state)

    // Wait a bit for UI to update
    await page.waitForTimeout(100)

    return success
  } catch (error) {
    console.error('Error restoring wallet state:', error)
    return false
  }
}

/**
 * Sets up a mock Ethereum provider for testing
 * @param {Object} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {string} options.initialAddress - Initial wallet address
 * @param {string} options.initialChainId - Initial chain ID
 * @returns {Promise} A promise that resolves when setup is complete
 */
async function setupMockEthereum(page, options = {}) {
  const initialAddress = options.initialAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const initialChainId = options.initialChainId || '0x1'

  try {
    await page.evaluate(
      ({ address, chainId }) => {
        window.ethereum = {
          isMetaMask: true,
          selectedAddress: address,
          chainId,
          networkVersion:
            chainId === '0x1' ? '1' : chainId === '0x5' ? '5' : chainId === '0x89' ? '137' : '0',
          _connected: true,
          _events: {},

          request: async ({ method, params = [] }) => {
            console.log(`Mock wallet: ${method} called with params:`, params)

            try {
              switch (method) {
                case 'eth_requestAccounts':
                  window.ethereum.selectedAddress = address
                  // Update UI if it exists
                  updateUI()
                  return [window.ethereum.selectedAddress]

                case 'eth_chainId':
                  return window.ethereum.chainId

                case 'wallet_switchEthereumChain':
                  const newChainId = params[0]?.chainId
                  if (newChainId) {
                    window.ethereum.chainId = newChainId
                    window.ethereum.networkVersion =
                      newChainId === '0x1'
                        ? '1'
                        : newChainId === '0x5'
                          ? '5'
                          : newChainId === '0x89'
                            ? '137'
                            : '0'

                    // Update UI if it exists
                    updateUI()
                  }
                  return null

                case 'eth_sendTransaction':
                  // Mock transaction success
                  const txHash =
                    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

                  // Update UI if transaction confirmation elements exist
                  const txConfirmation = document.getElementById('tx-confirmation')
                  if (txConfirmation) {
                    txConfirmation.style.display = 'block'
                  }

                  const txHashElement = document.getElementById('tx-hash')
                  if (txHashElement) {
                    txHashElement.textContent = txHash
                  }

                  return txHash

                default:
                  console.warn(`Unhandled method: ${method}`)
                  return null
              }
            } catch (error) {
              console.error(`Error in mock wallet request (${method}):`, error)
              throw error
            }
          },

          // Event listener registration
          on: (eventName, callback) => {
            console.log(`Mock wallet: registered event listener for ${eventName}`)
            if (!window.ethereum._events[eventName]) {
              window.ethereum._events[eventName] = []
            }
            window.ethereum._events[eventName].push(callback)
            return window.ethereum
          },

          // Event listener removal
          removeListener: (eventName, callback) => {
            console.log(`Mock wallet: removed event listener for ${eventName}`)
            if (window.ethereum._events[eventName]) {
              window.ethereum._events[eventName] = window.ethereum._events[eventName].filter(
                cb => cb !== callback
              )
            }
            return window.ethereum
          },

          // Helper to emit events
          emit: (eventName, ...args) => {
            if (window.ethereum._events[eventName]) {
              window.ethereum._events[eventName].forEach(callback => {
                try {
                  callback(...args)
                } catch (error) {
                  console.error(`Error in event handler for ${eventName}:`, error)
                }
              })
            }
          },
        }

        // Helper function to update UI based on current wallet state
        function updateUI() {
          if (document.getElementById('wallet-info')) {
            document.getElementById('wallet-info').style.display = window.ethereum.selectedAddress
              ? 'block'
              : 'none'
          }

          if (document.querySelector('.wallet-address') && window.ethereum.selectedAddress) {
            document.querySelector('.wallet-address').textContent = window.ethereum.selectedAddress
          }

          if (document.getElementById('network-name') && window.ethereum.chainId) {
            const networkNames = {
              '0x1': 'Ethereum Mainnet',
              '0x5': 'Goerli Testnet',
              '0x89': 'Polygon Mainnet',
            }
            document.getElementById('network-name').textContent =
              networkNames[window.ethereum.chainId] || `Chain ID: ${window.ethereum.chainId}`
          }
        }

        return window.ethereum
      },
      { address: initialAddress, chainId: initialChainId }
    )

    return true
  } catch (error) {
    console.error('Error setting up mock Ethereum provider:', error)
    return false
  }
}

/**
 * Updates UI elements to match the current wallet state
 * Used for tests that interact with UI elements
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function updateUIFromWalletState(page) {
  try {
    await page.evaluate(() => {
      if (!window.ethereum) {
        console.error('No ethereum object found when updating UI')
        return false
      }

      // Handle case when wallet is disconnected
      if (!window.ethereum.selectedAddress) {
        if (document.getElementById('wallet-info')) {
          document.getElementById('wallet-info').style.display = 'none'
        }
        return false
      }

      // Update UI for connected wallet
      if (document.getElementById('wallet-info')) {
        document.getElementById('wallet-info').style.display = 'block'
      }

      if (document.querySelector('.wallet-address')) {
        document.querySelector('.wallet-address').textContent = window.ethereum.selectedAddress
      }

      if (document.getElementById('network-name')) {
        const networkNames = {
          '0x1': 'Ethereum Mainnet',
          '0x5': 'Goerli Testnet',
          '0x89': 'Polygon Mainnet',
        }
        document.getElementById('network-name').textContent =
          networkNames[window.ethereum.chainId] || `Chain ID: ${window.ethereum.chainId}`
      }

      return true
    })

    return true
  } catch (error) {
    console.error('Error updating UI from wallet state:', error)
    return false
  }
}

/**
 * Wait for wallet UI elements to be visible
 * This is a critical helper function for tests that need to verify wallet UI state
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for waiting
 * @param {number} options.timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} Whether the wallet UI is visible
 */
async function waitForWalletUI(page, options = {}) {
  const timeout = options.timeout || 10000
  const pollInterval = 100
  const maxAttempts = timeout / pollInterval
  let attempts = 0

  try {
    // First check if the element exists
    const walletInfoExists = await page.evaluate(() => !!document.getElementById('wallet-info'))
    if (!walletInfoExists) {
      console.warn('Wallet info element does not exist in the DOM')
      return false
    }

    // Use polling approach instead of relying on Playwright's built-in toBeVisible
    while (attempts < maxAttempts) {
      const isVisible = await page.evaluate(() => {
        const walletInfo = document.getElementById('wallet-info')
        if (!walletInfo) return false

        // Check if element is visible according to both CSS and computed style
        const style = window.getComputedStyle(walletInfo)
        return (
          walletInfo.style.display !== 'none' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          walletInfo.offsetParent !== null
        )
      })

      if (isVisible) {
        return true
      }

      // Wait a bit before checking again
      await page.waitForTimeout(pollInterval)
      attempts++
    }

    console.warn(`Wallet UI not visible after ${timeout}ms`)
    return false
  } catch (error) {
    console.error('Error waiting for wallet UI:', error)
    return false
  }
}

// Force UI to show regardless of wallet state - useful for testing
async function forceShowWalletUI(page) {
  return await page.evaluate(() => {
    const walletInfo = document.getElementById('wallet-info')
    if (walletInfo) {
      walletInfo.style.display = 'block'
      return true
    }
    return false
  })
}

module.exports = {
  saveWalletState,
  restoreWalletState,
  setupMockEthereum,
  updateUIFromWalletState,
  waitForWalletUI,
  forceShowWalletUI,
}
