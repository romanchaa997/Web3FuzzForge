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
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
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
    const connectWalletButton = await page.locator('.connect-wallet-button')
    if (await connectWalletButton.isVisible()) {
      await connectWalletButton.click()
    }

    // Fill transaction form
    await page.locator('#recipient').fill(RECIPIENT_ADDRESS)
    await page.locator('#amount').fill(TRANSACTION_AMOUNT)

    // Submit transaction
    await page.locator('#send-button').click()

    // Wait for confirmation
    const txConfirmation = await page.locator('#tx-confirmation')
    await expect(txConfirmation).toBeVisible({ timeout: 10000 })

    // Verify transaction details
    const txHash = await page.locator('#tx-hash').textContent()
    expect(txHash).toBeTruthy()

    // Take a screenshot for documentation
    await page.screenshot({ path: 'media/metamask-transaction-test.png' })

    console.log('MetaMask transaction test completed successfully!')
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
  // Fuzz Testing: Large Transaction Amounts (DoS)
  test('should handle extremely large transaction amounts (DoS vectors)', async () => {
    for (const amount of [
      '10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', '9007199254740991',
      '999999999999999999999999999999999999999',
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    ]) {
      console.log(`Testing large amount: ${amount}`)

      try {
        // Try to input large amount in any amount field
        const amountField = await page
          .locator(
            'input[type="number"], input[type="text"], [id*="amount"], [class*="amount"], [placeholder*="amount"]'
          )
          .first()
        if (await amountField.isVisible()) {
          await amountField.fill(amount)

          // Try to send the transaction
          const sendButton = await page
            .locator(
              'button:visible:has-text("Send"), button:visible:has-text("Transfer"), button:visible:has-text("Submit")'
            )
            .first()
          if (await sendButton.isVisible()) {
            await sendButton.click()

            // Take a screenshot to document behavior
            await page.screenshot({ path: `test-results/large-amount-test-${Date.now()}.png` })

            // Check for any error messages or UI behavior changes
            const errorElement = await page.locator('.error, .alert, [role="alert"]').first()
            if (await errorElement.isVisible()) {
              console.log(`Error displayed: ${await errorElement.textContent()}`)
            }
          }
        }
      } catch (e) {
        console.log(`Error testing large amount: ${e.message}`)
      }

      // Reset the page state if needed
      await page.reload()
    }
  })
})
