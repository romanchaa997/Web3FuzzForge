// MetaMask connection test
const { test, expect } = require('@playwright/test')

// Test configuration
// eslint-disable-next-line no-unused-vars
const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
// eslint-disable-next-line no-unused-vars
const WALLET_NAME = 'Test Wallet'
// eslint-disable-next-line no-unused-vars
const NETWORK_NAME = 'Ethereum'

test.describe('MetaMask Connection Test', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    // Create a new page
    page = await browser.newPage()

    // Mock the ethereum provider before navigating to the page
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: null,
        request: async ({ method }) => {
          console.log(`MetaMask mock: ${method} called`)
          if (method === 'eth_requestAccounts') {
            window.ethereum.selectedAddress = '0x1234567890abcdef1234567890abcdef12345678'
            // Dispatch connection event
            window.dispatchEvent(new Event('ethereum#initialized'))
            return ['0x1234567890abcdef1234567890abcdef12345678']
          }
          return null
        },
        on: (eventName, callback) => {
          console.log(`MetaMask mock: registered event listener for ${eventName}`)
          window.addEventListener('ethereum#initialized', () => {
            if (eventName === 'accountsChanged') {
              callback(['0x1234567890abcdef1234567890abcdef12345678'])
            }
          })
        },
      }
    })

    // Navigate to the test page or use a blank page
    await page.goto('https://app.uniswap.org')
  })

  test('connects MetaMask wallet to dApp', async () => {
    // Find and click the "Connect Wallet" button
    const connectWalletButton = await page.locator('.connect-wallet-button')
    await expect(connectWalletButton).toBeVisible()
    await connectWalletButton.click()

    // Wait for wallet info to be displayed
    const walletInfo = await page.locator('#wallet-info')
    await expect(walletInfo).toBeVisible()

    // Check if wallet address is displayed correctly
    const walletAddressElement = await page.locator('.wallet-address')
    await expect(walletAddressElement).toContainText(WALLET_ADDRESS.substring(0, 10))

    // Take a screenshot for documentation
    await page.screenshot({ path: 'media/metamask-connection-test.png' })

    console.log('MetaMask connection test completed successfully!')
  })
})
