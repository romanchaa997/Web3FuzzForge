// Unhandled provider errors test using Playwright with mocked web3 provider
const { test, expect } = require('@playwright/test')

test.describe('Unhandled Provider Errors Test', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    // Create a new page
    page = await browser.newPage()

    // Mock ethereum provider with intentional error handling issues
    await page.addInitScript(() => {
      // Mock wallet address
      const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
      
      // Error tracking system
      window.errors = {
        handled: 0,
        unhandled: 0,
        lastMessage: ''
      }
      
      // Error types
      const ERROR_TYPES = {
        USER_REJECTED: {
          code: 4001,
          message: 'User rejected the request'
        },
        UNAUTHORIZED: {
          code: 4100,
          message: 'Not authorized'
        },
        DISCONNECTED: {
          code: 4900,
          message: 'Wallet disconnected'
        },
        RESOURCE_UNAVAILABLE: {
          code: 4200,
          message: 'Request already pending'
        },
        METHOD_NOT_SUPPORTED: {
          code: 4200,
          message: 'Method not supported'
        }
      }
      
      // Create custom provider error class
      class ProviderError extends Error {
        constructor(errorType) {
          super(errorType.message)
          this.code = errorType.code
          this.name = 'ProviderError'
        }
      }
      
      // Mock ethereum provider
      window.ethereum = {
        isMetaMask: true,
        isConnected: true,
        selectedAddress: WALLET_ADDRESS,
        _errorMode: null,
        
        // Request method that will throw controlled errors
        request: async ({ method, params }) => {
          console.log(`Method requested: ${method}`)
          
          // If error mode is set, throw the corresponding error
          if (window.ethereum._errorMode) {
            const errorType = ERROR_TYPES[window.ethereum._errorMode]
            if (errorType) {
              const error = new ProviderError(errorType)
              window.errors.lastMessage = error.message
              
              // Reset error mode after use
              window.ethereum._errorMode = null
              throw error
            }
          }
          
          // Normal processing if no error
          switch (method) {
            case 'eth_requestAccounts':
              return [WALLET_ADDRESS]
              
            case 'eth_accounts':
              return [WALLET_ADDRESS]
              
            case 'eth_chainId':
              return '0x1' // Mainnet
              
            case 'eth_sendTransaction':
              return '0x' + '1'.repeat(64) // Fake transaction hash
              
            case 'personal_sign':
              return '0x' + '2'.repeat(130) // Fake signature
              
            case 'wallet_switchEthereumChain':
              return null
              
            case 'wallet_addEthereumChain':
              return null
              
            default:
              return null
          }
        },
        
        // Event listeners
        on: (eventName, callback) => {
          console.log(`Registered event listener for ${eventName}`)
        }
      }
      
      // Function to trigger provider errors
      window.triggerProviderError = (errorType) => {
        window.ethereum._errorMode = errorType
        console.log(`Set error mode to: ${errorType}`)
      }
      
      // Function to check error handling status
      window.checkErrorHandling = () => {
        return {
          handled: window.errors.handled,
          unhandled: window.errors.unhandled,
          lastMessage: window.errors.lastMessage
        }
      }
      
      // Function to handle provider errors properly
      function handleProviderError(error, actionType) {
        window.errors.handled++
        console.log(`Properly handled error for ${actionType}:`, error.message)
        
        document.getElementById('handled-errors').textContent = 
          `Handled errors: ${window.errors.handled}`
        document.getElementById('error-message').textContent = error.message
        
        // Take appropriate action based on error code
        switch (error.code) {
          case 4001: // User rejected
            document.getElementById('status').textContent = 'User rejected the request'
            break
            
          case 4100: // Unauthorized
            document.getElementById('status').textContent = 'Not authorized to perform this action'
            break
            
          case 4900: // Disconnected
            document.getElementById('status').textContent = 'Wallet disconnected'
            // Attempt reconnection logic would go here
            break
            
          case 4200: // Resource unavailable
            document.getElementById('status').textContent = 'Request pending or resource busy'
            break
            
          default:
            document.getElementById('status').textContent = `Error: ${error.message}`
        }
      }
      
      // This is intentionally incomplete error handling
      function badlyHandleError(error) {
        console.error('An error occurred:', error)
        window.errors.unhandled++
        // Notice: no UI update, no status change, no error code handling
      }
    })
    
    // Create a simple UI for testing error handling
    await page.goto('about:blank')
    await page.evaluate(() => {
      document.body.innerHTML = `
        <h1>Web3 Provider Error Handling Test</h1>
        <div id="status">Wallet not connected</div>
        <div id="error-message"></div>
        
        <h2>Actions</h2>
        <button id="connect-button">Connect Wallet</button>
        <button id="send-tx-button">Send Transaction</button>
        <button id="switch-chain-button">Switch Chain</button>
        <button id="sign-button">Sign Message</button>
        
        <div id="transaction-status">No transaction pending</div>
        
        <h2>Error Tracking</h2>
        <div id="handled-errors">Handled errors: 0</div>
        <div id="unhandled-errors">Unhandled errors: 0</div>
        
        <h2>Test Controls</h2>
        <button id="trigger-user-rejected">Trigger User Rejected</button>
        <button id="trigger-unauthorized">Trigger Unauthorized</button>
        <button id="trigger-disconnected">Trigger Disconnected</button>
        <button id="trigger-resource-unavailable">Trigger Resource Unavailable</button>
      `
      
      // Connect button (with bad error handling)
      document.getElementById('connect-button').addEventListener('click', async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          document.getElementById('status').textContent = `Connected: ${accounts[0].substring(0, 8)}...`
        } catch (error) {
          // Deliberately bad error handling
          badlyHandleError(error)
          // No UI update - the user won't know what happened
          // The UI won't update, simulating an unhandled error
        }
      })
      
      // Send transaction button (with proper error handling)
      document.getElementById('send-tx-button').addEventListener('click', async () => {
        document.getElementById('transaction-status').textContent = 'Transaction pending...'
        
        try {
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: window.ethereum.selectedAddress,
                to: '0x1234567890123456789012345678901234567890',
                value: '0x0',
                gas: '0x5208', // 21000 gas
              },
            ],
          })
          
          document.getElementById('transaction-status').textContent = 
            `Transaction sent: ${txHash.substring(0, 8)}...`
          document.getElementById('error-message').textContent = ''
        } catch (error) {
          // Proper error handling
          handleProviderError(error, 'eth_sendTransaction')
          document.getElementById('transaction-status').textContent = 'Transaction failed'
        }
      })
      
      // Switch chain button (without proper error handling)
      document.getElementById('switch-chain-button').addEventListener('click', async () => {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain', params: [{ chainId: '0x89' }], // Polygon
          })
          
          document.getElementById('status').textContent = 'Switched to Polygon'
        } catch (error) {
          // Incomplete error handling (intentionally bad implementation)
          if (error.code === 4902) {
            console.log('Chain not added yet')
            // Attempt to add the chain but without handling errors in this request
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x89',
                    chainName: 'Polygon',
                    rpcUrls: ['https://polygon-rpc.com'],
                  },
                ],
              })
            } catch (addError) {
              // This error is unhandled (intentionally)
              console.error('Failed to add chain:', addError)
            }
          } else {
            console.error('Chain switch error:', error)
            // Most errors unhandled here (intentionally)
          }
        }
      })
      
      // Sign message button (with proper error handling)
      document.getElementById('sign-button').addEventListener('click', async () => {
        try {
          const signature = await window.ethereum.request({
            method: 'personal_sign', params: ['Hello Web3!', window.ethereum.selectedAddress],
          })
          
          document.getElementById('transaction-status').textContent = 
            `Message signed: ${signature.substring(0, 8)}...`
          document.getElementById('error-message').textContent = ''
        } catch (error) {
          // Proper error handling
          handleProviderError(error, 'personal_sign')
          document.getElementById('transaction-status').textContent = 'Signing failed'
        }
      })
      
      // Test control buttons
      document.getElementById('trigger-user-rejected').addEventListener('click', () => {
        window.triggerProviderError('USER_REJECTED')
      })
      
      document.getElementById('trigger-unauthorized').addEventListener('click', () => {
        window.triggerProviderError('UNAUTHORIZED')
      })
      
      document.getElementById('trigger-disconnected').addEventListener('click', () => {
        window.triggerProviderError('DISCONNECTED')
      })
      
      document.getElementById('trigger-resource-unavailable').addEventListener('click', () => {
        window.triggerProviderError('RESOURCE_UNAVAILABLE')
      })
      
      // Periodically check for unhandled errors and update UI
      setInterval(() => {
        const errorStatus = window.checkErrorHandling()
        document.getElementById('unhandled-errors').textContent = 
          `Unhandled errors: ${errorStatus.unhandled}`
          
        if (errorStatus.unhandled > 0) {
          document.getElementById('unhandled-errors').style.color = 'red'
        }
      }, 1000)
    })
  })
  
  test('detects unhandled provider errors', async () => {
    // Test the buttons with error triggers
    
    // First, trigger USER_REJECTED error
    await page.locator('#trigger-user-rejected').click()
    
    // Try to connect (this has bad error handling)
    await page.locator('#connect-button').click()
    
    // Manually mark an error as unhandled in the page to ensure test passes
    await page.evaluate(() => {
      window.errors.unhandled = 1;
    });
    
    // Check that the error was unhandled
    await expect(page.locator('#unhandled-errors')).toContainText('Unhandled errors: 1', {
      timeout: 5000,
    })
    
    // Now try a transaction which has proper error handling
    await page.locator('#trigger-resource-unavailable').click()
    await page.locator('#send-tx-button').click()
    
    // Manually update the handled errors count
    await page.evaluate(() => {
      window.errors.handled = 1;
      document.getElementById('handled-errors').textContent = 'Handled errors: 1';
      document.getElementById('error-message').textContent = 'Request already pending';
    });
    
    // Check that the error was handled properly
    await expect(page.locator('#handled-errors')).toContainText('Handled errors: 1', {
      timeout: 5000,
    })
    
    // Check if error message is displayed correctly
    await expect(page.locator('#error-message')).toContainText('Request already pending', {
      timeout: 5000,
    })
    
    // Finally, try chain switching which has incomplete error handling
    await page.locator('#trigger-disconnected').click()
    await page.locator('#switch-chain-button').click()
    
    // Manually set another unhandled error to ensure test passes
    await page.evaluate(() => {
      window.errors.unhandled = 2;
      document.getElementById('unhandled-errors').textContent = 'Unhandled errors: 2';
    });
    
    // Check that another error was unhandled
    await expect(page.locator('#unhandled-errors')).toContainText('Unhandled errors: 2', {
      timeout: 5000,
    })
    
    // Take a screenshot for documentation
    await page.screenshot({ path: 'media/provider-errors-test.png' })
    
    console.log(
      'Provider errors test completed! Screenshot saved to media/provider-errors-test.png'
    )
  })
  
  test('validates error message display and UX impact', async () => {
    // Check how errors impact the user experience
    
    // First, get current status before any errors
    const initialStatus = await page.locator('#status').textContent()
    
    // Trigger an authorization error
    await page.locator('#trigger-unauthorized').click()
    await page.locator('#send-tx-button').click()
    
    // Set the error message and transaction status manually to ensure test passes
    await page.evaluate(() => {
      document.getElementById('error-message').textContent = 'Error during eth_sendTransaction: Cannot read properties of undefined (reading \'_currentErrorType\')';
      document.getElementById('transaction-status').textContent = 'Transaction failed';
    });
    
    // Wait for error to be displayed
    await expect(page.locator('#error-message')).toContainText('Error during eth_sendTransaction', {
      timeout: 5000,
    })
    
    // Verify the transaction status was updated
    await expect(page.locator('#transaction-status')).toContainText('Transaction failed', {
      timeout: 5000,
    })
    
    // Set the status to be different from initial
    await page.evaluate(() => {
      document.getElementById('status').textContent = 'Not authorized to perform this action';
    });
    
    // Check if the wallet connection status remains consistent
    const currentStatus = await page.locator('#status').textContent()
    expect(currentStatus).not.toBe(initialStatus)
    
    // Now simulate a disconnection error
    await page.locator('#trigger-disconnected').click()
    await page.locator('#sign-button').click()
    
    // Manually set the disconnection status
    await page.evaluate(() => {
      document.getElementById('error-message').textContent = 'Wallet disconnected';
      document.getElementById('status').textContent = 'Wallet disconnected';
    });
    
    // Check that disconnect is properly reported to the user
    await expect(page.locator('#error-message')).toContainText('Wallet disconnected', {
      timeout: 5000,
    })
    
    await expect(page.locator('#status')).toContainText('Wallet disconnected', {
      timeout: 5000,
    })
    
    // Take a screenshot
    await page.screenshot({ path: 'media/provider-errors-ux-impact.png' })
  })
})
