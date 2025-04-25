// Simplified wallet snapshot test
const { test, expect } = require('@playwright/test')

test.describe('Simplified Wallet State Tests', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    // Create a new page
    page = await browser.newPage()

    // Set up a minimal test page with required elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Simple Wallet Test</title>
      </head>
      <body>
        <h1>Wallet Test</h1>
        <div id="wallet-info" style="display:none;">
          <p>Address: <span id="address">Not connected</span></p>
          <p>Network: <span id="network">Not connected</span></p>
        </div>
      </body>
      </html>
    `)

    // Add mock ethereum provider
    await page.evaluate(() => {
      window.ethereum = {
        selectedAddress: null,
        chainId: '0x1',
        networkVersion: '1',

        // Simple mock implementation
        connect: function () {
          this.selectedAddress = '0x1234567890123456789012345678901234567890'
          document.getElementById('wallet-info').style.display = 'block'
          document.getElementById('address').textContent = this.selectedAddress
          document.getElementById('network').textContent = 'Ethereum Mainnet'
          return true
        },

        disconnect: function () {
          this.selectedAddress = null
          document.getElementById('wallet-info').style.display = 'none'
          document.getElementById('address').textContent = 'Not connected'
          document.getElementById('network').textContent = 'Not connected'
          return true
        },

        switchNetwork: function (chainId) {
          this.chainId = chainId
          const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x89': 'Polygon Mainnet',
          }
          document.getElementById('network').textContent = networks[chainId] || 'Unknown Network'
          return true
        },
      }
    })
  })

  // Helper to save wallet state
  async function saveState(page) {
    return await page.evaluate(() => {
      return {
        connected: window.ethereum.selectedAddress !== null,
        address: window.ethereum.selectedAddress,
        chainId: window.ethereum.chainId,
        networkVersion: window.ethereum.networkVersion,
      }
    })
  }

  // Helper to restore wallet state
  async function restoreState(page, state) {
    await page.evaluate(state => {
      window.ethereum.selectedAddress = state.address
      window.ethereum.chainId = state.chainId
      window.ethereum.networkVersion = state.networkVersion

      // Update UI
      if (state.connected) {
        document.getElementById('wallet-info').style.display = 'block'
        document.getElementById('address').textContent = state.address

        const networks = {
          '0x1': 'Ethereum Mainnet',
          '0x89': 'Polygon Mainnet',
        }
        document.getElementById('network').textContent =
          networks[state.chainId] || 'Unknown Network'
      } else {
        document.getElementById('wallet-info').style.display = 'none'
        document.getElementById('address').textContent = 'Not connected'
        document.getElementById('network').textContent = 'Not connected'
      }
    }, state)
  }

  test('Basic save and restore wallet state', async () => {
    // Connect wallet
    await page.evaluate(() => {
      window.ethereum.connect()
    })

    // Verify connected
    const walletInfoVisible = await page.evaluate(() => {
      return document.getElementById('wallet-info').style.display !== 'none'
    })
    expect(walletInfoVisible).toBe(true)

    // Save state
    const connectedState = await saveState(page)
    expect(connectedState.connected).toBe(true)
    expect(connectedState.address).toBe('0x1234567890123456789012345678901234567890')

    // Disconnect
    await page.evaluate(() => {
      window.ethereum.disconnect()
    })

    // Verify disconnected
    const disconnected = await page.evaluate(() => {
      return document.getElementById('wallet-info').style.display === 'none'
    })
    expect(disconnected).toBe(true)

    // Restore connected state
    await restoreState(page, connectedState)

    // Verify restored
    const restored = await page.evaluate(() => {
      return {
        visible: document.getElementById('wallet-info').style.display !== 'none',
        address: document.getElementById('address').textContent,
      }
    })

    expect(restored.visible).toBe(true)
    expect(restored.address).toBe('0x1234567890123456789012345678901234567890')
  })
})
