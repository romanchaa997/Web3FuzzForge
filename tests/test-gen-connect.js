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
  // Fuzz Testing: XSS Payloads
  test('should handle XSS payloads in input fields', async () => {
    for (const payload of [
      '<script>alert(1)</script>',
      '"><script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      '"><svg onload=alert(1)>',
      'javascript:alert(1)',
    ]) {
      console.log(`Testing XSS payload: ${payload}`)

      // Try XSS in recipient field if available
      try {
        const recipientField = await page
          .locator(
            'input[type="text"], [id*="recipient"], [class*="recipient"], [placeholder*="recipient"], [placeholder*="address"]'
          )
          .first()
        if (await recipientField.isVisible()) {
          await recipientField.fill(payload)
          await page.screenshot({ path: `test-results/xss-test-recipient-${Date.now()}.png` })
        }
      } catch (e) {
        console.log(`Error testing recipient field: ${e.message}`)
      }

      // Try XSS in all input fields
      try {
        const inputFields = await page.locator('input:visible').all()
        for (let i = 0; i < inputFields.length; i++) {
          const field = inputFields[i]
          await field.fill(payload)
          await page.screenshot({ path: `test-results/xss-test-field-${i}-${Date.now()}.png` })
        }
      } catch (e) {
        console.log(`Error testing input fields: ${e.message}`)
      }

      // Try clicking buttons after injection to see if payload executes
      try {
        const buttons = await page.locator('button:visible').all()
        for (let i = 0; i < buttons.length; i++) {
          await buttons[i].click().catch(() => console.log('Button click failed, continuing...'))
        }
      } catch (e) {
        console.log(`Error clicking buttons: ${e.message}`)
      }
    }
  })
  // Fuzz Testing: eth_sign Phishing Vectors
  test('should detect potential eth_sign phishing vectors', async () => {
    for (const phishingPayload of [
      'Sign this message to verify', 'Please sign to verify your account.',
      'Click to sign and verify your wallet.',
    ]) {
      console.log(`Testing eth_sign phishing payload: ${phishingPayload}`)

      try {
        // Mock the ethereum provider to test signing behavior with phishing vectors
        await page.evaluate(payload => {
          if (window.ethereum) {
            // Store original functions
            const originalRequest = window.ethereum.request
            const originalSendAsync = window.ethereum.sendAsync

            // Mock request method
            window.ethereum.request = async function (args) {
              if (args.method === 'personal_sign' || args.method === 'eth_sign') {
                console.log('Intercepted signing request with potential phishing payload')
                // Replace message with phishing payload or append to it
                if (Array.isArray(args.params) && args.params.length > 0) {
                  // For personal_sign, the message is usually the second param (after address)
                  const messageIndex = args.method === 'personal_sign' ? 0 : 1
                  if (typeof args.params[messageIndex] === 'string') {
                    args.params[messageIndex] = payload
                  }
                }
              }
              return originalRequest.call(this, args)
            }

            // Mock sendAsync for older providers
            if (originalSendAsync) {
              window.ethereum.sendAsync = function (payload, callback) {
                if (payload.method === 'personal_sign' || payload.method === 'eth_sign') {
                  console.log('Intercepted sendAsync signing request')
                  if (Array.isArray(payload.params) && payload.params.length > 0) {
                    const messageIndex = payload.method === 'personal_sign' ? 0 : 1
                    if (typeof payload.params[messageIndex] === 'string') {
                      payload.params[messageIndex] = phishingPayload
                    }
                  }
                }
                return originalSendAsync.call(this, payload, callback)
              }
            }
          }
        }, phishingPayload)

        // Find and click any "Sign" or similar buttons
        const signButtons = await page
          .locator(
            'button:has-text("Sign"), button:has-text("Approve"), button:has-text("Confirm")'
          )
          .all()
        for (let i = 0; i < signButtons.length; i++) {
          await signButtons[i]
            .click()
            .catch(() => console.log('Sign button click failed, continuing...'))
          await page.screenshot({
            path: `test-results/eth-sign-phishing-test-${i}-${Date.now()}.png`,
          })
        }
      } catch (e) {
        console.log(`Error testing eth_sign phishing vector: ${e.message}`)
      }

      // Reset the page state
      await page.reload()
    }
  })
})
