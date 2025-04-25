/**
 * Simplified Wallet State Snapshot Utilities
 *
 * This is a more reliable and simplified approach for wallet state management.
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
        return {
          selectedAddress: null,
          chainId: '0x1',
          networkVersion: '1',
          uiState: { walletInfoVisible: false },
        }
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

    return {
      ...state,
      customData,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error saving wallet state:', error)
    return {
      selectedAddress: null,
      chainId: '0x1',
      networkVersion: '1',
      uiState: { walletInfoVisible: false },
      error: error.message,
    }
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
    console.error('Cannot restore null or undefined wallet state')
    return false
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
      window.ethereum.networkVersion = state.networkVersion

      // Update UI directly
      updateUI()

      function updateUI() {
        // Update wallet info display
        const walletInfo = document.getElementById('wallet-info')
        if (walletInfo) {
          walletInfo.style.display = state.selectedAddress ? 'block' : 'none'
        }

        // Update wallet address
        const addressElements = document.querySelectorAll('.wallet-address')
        if (addressElements.length > 0 && state.selectedAddress) {
          addressElements.forEach(el => {
            el.textContent = state.selectedAddress
          })
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

    // Wait for UI to update
    await page.waitForTimeout(300)

    return success
  } catch (error) {
    console.error('Error restoring wallet state:', error)
    return false
  }
}

/**
 * Force UI elements to show regardless of state
 * @param {Object} page - Playwright page object
 */
async function forceShowWalletUI(page) {
  await page.evaluate(() => {
    // Force wallet info to display
    const walletInfo = document.getElementById('wallet-info')
    if (walletInfo) {
      walletInfo.style.display = 'block'
    }

    // Set address if wallet is connected
    if (window.ethereum?.selectedAddress) {
      const addressElements = document.querySelectorAll('.wallet-address')
      addressElements.forEach(el => {
        el.textContent = window.ethereum.selectedAddress
      })
    }
  })
}

module.exports = {
  saveWalletState,
  restoreWalletState,
  forceShowWalletUI,
}
