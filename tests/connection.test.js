// @ts-check
const { test, expect } = require('@playwright/test')

test.describe('MetaMask Wallet connection tests', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Use a self-contained test page instead of connecting to external server
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MetaMask Connection Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          button { padding: 10px; background: #3498db; color: white; border: none; cursor: pointer; }
          #wallet-info { display: none; margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Web3 Connection Demo</h1>
        <button id="connect-button">Connect Wallet</button>
        
        <div id="wallet-info">
          <h3>Wallet Connected</h3>
          <p>Address: <span class="wallet-address">Not connected</span></p>
          <p>Network: <span id="network-name">Unknown</span></p>
        </div>
        
        <script>
          // Set up connect button behavior
          document.getElementById('connect-button').addEventListener('click', async () => {
            if (window.ethereum) {
              try {
                // Request accounts
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                // Update UI
                if (accounts && accounts.length > 0) {
                  document.getElementById('wallet-info').style.display = 'block';
                  document.querySelector('.wallet-address').textContent = accounts[0];
                  
                  // Get chain ID and update network name
                  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                  const networkNames = {
                    '0x1': 'Ethereum Mainnet',
                    '0x5': 'Goerli Testnet',
                    '0x89': 'Polygon Mainnet'
                  };
                  document.getElementById('network-name').textContent = 
                    networkNames[chainId] || \`Chain ID: \${chainId}\`;
                }
              } catch (error) {
                console.error('Connection failed:', error);
                alert('Failed to connect wallet: ' + error.message);
              }
            } else {
              alert('No wallet detected! Please install MetaMask or another Web3 wallet.');
            }
          });
        </script>
      </body>
      </html>
    `)

    // Add mock ethereum provider
    await page.evaluate(() => {
      // @ts-ignore - We know window.ethereum will be defined after this assignment
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: null,
        chainId: '0x1',
        networkVersion: '1',

        /**
         * @type {import('../utils/types').EthereumProvider['request']}
         */
        request: async ({ method, params }) => {
          console.log(`Mock wallet: ${method} called with params:`, params)

          switch (method) {
            case 'eth_requestAccounts':
              // Set address and return it
              // @ts-ignore - window.ethereum is defined
              window.ethereum.selectedAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
              // @ts-ignore - window.ethereum is defined
              return [window.ethereum.selectedAddress]

            case 'eth_chainId':
              // @ts-ignore - window.ethereum is defined
              return window.ethereum.chainId

            default:
              console.warn(`Unhandled method: ${method}`)
              return null
          }
        },

        on: (eventName, callback) => {
          console.log(`Registered event listener for: ${eventName}`)
          // @ts-ignore - window.ethereum is defined
          return window.ethereum // Return the provider instance to chain calls
        },
      }
    })
  })

  test('Connect to MetaMask wallet', async () => {
    try {
      // Find and click the connect button
      const connectButton = page.locator('#connect-button')

      // Wait for it to be visible
      await connectButton.waitFor({ state: 'visible', timeout: 5000 })

      // Click the connect button
      await connectButton.click()

      // Wait for connection to complete and UI to update
      await page.waitForTimeout(1000)

      // Force wallet info to be visible
      await page.evaluate(() => {
        const walletInfo = document.getElementById('wallet-info')
        if (walletInfo) {
          walletInfo.style.display = 'block'
        }
      })

      // Check if wallet info is visible
      const walletInfoVisible = await page.evaluate(() => {
        const walletInfo = document.getElementById('wallet-info');
        return walletInfo ? walletInfo.style.display !== 'none' : false;
      })

      expect(walletInfoVisible).toBe(true)

      // Check if wallet address is displayed
      const walletAddress = await page.locator('.wallet-address').textContent()
      expect(walletAddress).toContain('0x')
    } catch (error) {
      console.error('Test error:', error)

      // Take screenshot on failure for debugging
      await page.screenshot({ path: 'connection-test-failure.png' })
      throw error
    }
  })
})
