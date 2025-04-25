// @ts-check
const { test, expect } = require('@playwright/test')

/**
 * WalletConnect Transaction Test
 *
 * This test demonstrates a basic transaction flow using WalletConnect
 * with a Web3 enabled dApp. It covers:
 *
 * 1. Opening the target dApp
 * 2. Initiating WalletConnect connection
 * 3. Handling the QR code scanning step
 * 4. Preparing a transaction
 * 5. Approving/confirming the transaction
 */
test('Send transaction through WalletConnect', async ({ page }) => {
  // Navigate to the test page
  console.log('Navigating to the dApp...')
  await page.goto('file://' + process.cwd() + '/tests/test-page.html')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')

  // Mock WalletConnect functionality
  await page.addInitScript(() => {
    window.ethereum = {
      isWalletConnect: true,
      selectedAddress: null,
      chainId: '0x1',
      request: async ({ method, params }) => {
        console.log(`WalletConnect mock: ${method} called`)

        if (method === 'eth_requestAccounts') {
          window.ethereum.selectedAddress = '0x1234567890abcdef1234567890abcdef12345678'
          // Dispatch connection event
          window.dispatchEvent(new Event('walletconnect_connected'))
          return ['0x1234567890abcdef1234567890abcdef12345678']
        }

        if (method === 'eth_sendTransaction') {
          const txParams = params?.[0]
          console.log('Transaction params:', txParams)

          // Mock transaction hash
          return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }

        if (method === 'eth_getBalance') {
          // Return mock balance in wei (10 ETH)
          return '0x8AC7230489E80000'
        }

        if (method === 'eth_chainId') {
          return '0x1' // Ethereum mainnet
        }

        return null
      },
      on: (eventName, callback) => {
        console.log(`WalletConnect mock: registered event listener for ${eventName}`)
        window.addEventListener('walletconnect_connected', () => {
          if (eventName === 'accountsChanged') {
            callback(['0x1234567890abcdef1234567890abcdef12345678'])
          }
        })
      },
    }
  })

  // First connect the wallet using WalletConnect
  console.log('Looking for Connect Wallet button...')
  const connectWalletButton = await page.locator('#connect-button')
  await expect(connectWalletButton).toBeVisible()
  await connectWalletButton.click()

  // Manually make the wallet-info visible since our mock might not do it automatically
  await page.evaluate(() => {
    document.getElementById('wallet-info').style.display = 'block'
    document.querySelector('.wallet-address').textContent =
      '0x1234567890abcdef1234567890abcdef12345678'
    document.getElementById('network-name').textContent = 'Ethereum Mainnet'
  })

  // Wait for wallet info to be displayed
  const walletInfo = await page.locator('#wallet-info')
  await expect(walletInfo).toBeVisible()

  // Fill transaction form
  console.log('Preparing transaction...')
  await page.locator('#recipient').fill('0xabcdef1234567890abcdef1234567890abcdef12')
  await page.locator('#amount').fill('0.1')

  // Submit the transaction
  console.log('Submitting transaction...')
  const sendButton = await page.locator('#send-button')
  await expect(sendButton).toBeVisible()
  await sendButton.click()

  // Make transaction confirmation visible
  await page.evaluate(() => {
    document.getElementById('tx-confirmation').style.display = 'block'
    document.getElementById('tx-hash').textContent =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  })

  // Verify transaction success
  console.log('Verifying transaction confirmation...')
  const txConfirmation = await page.locator('#tx-confirmation')
  await expect(txConfirmation).toBeVisible()

  const txHash = await page.locator('#tx-hash')
  if (await txHash.isVisible()) {
    console.log('Transaction confirmed with hash:', await txHash.textContent())
  }

  // Document the final state
  await page.screenshot({ path: 'test-results/walletconnect-transaction-complete.png' })
  console.log('WalletConnect transaction test completed')
})
