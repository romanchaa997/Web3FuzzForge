// MetaMask transaction test
const { test, expect } = require('@playwright/test')

// Test configuration
// eslint-disable-next-line no-unused-vars
const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const RECIPIENT_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12'
const TRANSACTION_AMOUNT = '0.1'
// eslint-disable-next-line no-unused-vars
const NETWORK_NAME = 'Ethereum'

test.describe('MetaMask Transaction Test', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    // Create a new page
    page = await browser.newPage()

    // Mock the ethereum provider before navigating to the page
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: '0x1',
        request: async ({ method, params }) => {
          console.log(`MetaMask mock: ${method} called`)

          if (method === 'eth_requestAccounts') {
            return ['0x1234567890abcdef1234567890abcdef12345678']
          }

          if (method === 'eth_sendTransaction') {
            const txParams = params[0]
            console.log('Transaction params:', txParams)

            // Mock transaction hash
            return '0x0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
          }

          if (method === 'eth_getBalance') {
            // Return mock balance in wei (10 ETH)
            return '0x8AC7230489E80000'
          }

          return null
        },
        on: (eventName, callback) => {
          console.log(`MetaMask mock: registered event listener for ${eventName}`)
        },
      }
    })

    // Navigate to the test page or use a blank page
    await page.goto('https://app.uniswap.org')
  })

  test('sends transaction through MetaMask', async () => {
    // Connect wallet if needed
    const connectWalletButton = await page.locator('button:has-text("Connect")')
    if (await connectWalletButton.isVisible()) {
      await connectWalletButton.click()
    }

    // Fill transaction form
    await page.locator('#recipient').fill(RECIPIENT_ADDRESS)
    await page.locator('#amount').fill(TRANSACTION_AMOUNT)

    // Submit transaction
    await page.locator('#send-button').click()

    // Wait for confirmation
    const txConfirmation = await page.locator('.transaction-status')
    await expect(txConfirmation).toBeVisible({ timeout: 10000 })

    // Verify transaction details
    const txHash = await page.locator('.transaction-hash').textContent()
    expect(txHash).toBeTruthy()

    // Take a screenshot for documentation
    await page.screenshot({ path: 'media/metamask-transaction-test.png' })

    console.log('MetaMask transaction test completed successfully!')
  })
})
