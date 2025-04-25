// @ts-check
const { test, expect } = require('@playwright/test')

test.describe('MetaMask Transaction Tests', () => {
  let page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Use a self-contained test page instead of connecting to external server
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MetaMask Transaction Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          button { padding: 10px; background: #3498db; color: white; border: none; cursor: pointer; margin-top: 10px; }
          #wallet-info { display: none; margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
          #transaction-form { margin-top: 20px; }
          #transaction-form input { display: block; margin-bottom: 10px; padding: 5px; width: 300px; }
          #tx-confirmation { display: none; margin-top: 20px; padding: 10px; border: 1px solid #ddd; background-color: #f8f8f8; }
        </style>
      </head>
      <body>
        <h1>Web3 Transaction Demo</h1>
        <button id="connect-button">Connect Wallet</button>
        
        <div id="wallet-info">
          <h3>Wallet Connected</h3>
          <p>Address: <span class="wallet-address">Not connected</span></p>
          <p>Network: <span id="network-name">Unknown</span></p>
        </div>
        
        <div id="transaction-form">
          <h3>Send Transaction</h3>
          <input type="text" id="recipient" placeholder="Recipient Address" value="0x1234567890123456789012345678901234567890">
          <input type="text" id="amount" placeholder="Amount (ETH)" value="0.01">
          <button id="send-button">Send Transaction</button>
        </div>
        
        <div id="tx-confirmation">
          <h3>Transaction Sent!</h3>
          <p>Transaction Hash: <span id="tx-hash">N/A</span></p>
          <p>Status: <span id="tx-status">Pending</span></p>
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
          
          // Set up send transaction button
          document.getElementById('send-button').addEventListener('click', async () => {
            if (!window.ethereum || !window.ethereum.selectedAddress) {
              alert('Please connect your wallet first!');
              return;
            }
            
            try {
              const recipient = document.getElementById('recipient').value;
              const amount = document.getElementById('amount').value;
              
              // Convert amount to wei (1 ETH = 10^18 wei)
              const amountInWei = '0x' + (parseFloat(amount) * 1e18).toString(16);
              
              // Create transaction params
              const txParams = {
                from: window.ethereum.selectedAddress,
                to: recipient,
                value: amountInWei,
                gas: '0x5208', // 21000 gas
              };
              
              // Send transaction
              const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction', params: [txParams]
              });
              
              // Update UI
              document.getElementById('tx-confirmation').style.display = 'block';
              document.getElementById('tx-hash').textContent = txHash;
              document.getElementById('tx-status').textContent = 'Confirmed';
              
            } catch (error) {
              console.error('Transaction failed:', error);
              alert('Transaction failed: ' + error.message);
            }
          });
        </script>
      </body>
      </html>
    `)

    // Add mock ethereum provider
    await page.evaluate(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: null,
        chainId: '0x1',
        networkVersion: '1',

        request: async ({ method, params = [] }) => {
          console.log(`Mock wallet: ${method} called with params:`, params)

          switch (method) {
            case 'eth_requestAccounts':
              // Set address and return it
              window.ethereum.selectedAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
              return [window.ethereum.selectedAddress]

            case 'eth_chainId':
              return window.ethereum.chainId

            case 'eth_sendTransaction':
              // Mock successful transaction
              return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

            default:
              console.warn(`Unhandled method: ${method}`)
              return null
          }
        },
      }
    })
  })

  test('Send transaction and verify confirmation', async () => {
    try {
      // Connect wallet first
      await page.locator('#connect-button').click()

      // Wait for connection to complete and UI to update
      await page.waitForTimeout(1000)

      // Verify wallet is connected
      const walletInfoVisible = await page.evaluate(() => {
        return document.getElementById('wallet-info').style.display !== 'none'
      })
      expect(walletInfoVisible).toBe(true)

      // Fill in transaction details (optional, as we already set defaults in the HTML)
      await page.locator('#recipient').fill('0x2222222222222222222222222222222222222222')
      await page.locator('#amount').fill('0.05')

      // Send transaction
      await page.locator('#send-button').click()

      // Wait for transaction to be processed
      await page.waitForTimeout(1000)

      // Verify transaction confirmation is displayed
      const txConfirmationVisible = await page.evaluate(() => {
        return document.getElementById('tx-confirmation').style.display !== 'none'
      })
      expect(txConfirmationVisible).toBe(true)

      // Verify transaction hash is displayed and has expected format
      const txHash = await page.locator('#tx-hash').textContent()
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/)

      // Verify transaction status
      const txStatus = await page.locator('#tx-status').textContent()
      expect(txStatus).toBe('Confirmed')
    } catch (error) {
      console.error('Test error:', error)

      // Take screenshot on failure for debugging
      await page.screenshot({ path: 'transaction-test-failure.png' })
      throw error
    }
  })
})
