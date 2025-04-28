async function setupTestPageWithUI(page) {
  // Create a simple test page with Web3 integration
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Web3 Security Test Page</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .error { color: red; display: none; }
        .success { color: green; display: none; }
        input { width: 100%; padding: 8px; margin: 8px 0; }
        button { padding: 8px 16px; margin: 8px 0; }
      </style>
    </head>
    <body>
      <h1>Web3 Security Test Page</h1>
      
      <!-- Wallet Connection -->
      <div id="wallet-section">
        <button id="connect-wallet">Connect Wallet</button>
        <p id="wallet-address"></p>
        <p id="connection-error" class="error"></p>
      </div>

      <!-- Transaction Form -->
      <div id="transaction-section">
        <h2>Send Transaction</h2>
        <input type="text" id="recipient" placeholder="Recipient Address (0x...)" />
        <input type="text" id="amount" placeholder="Amount in ETH" />
        <button id="send-tx">Send</button>
        <p id="tx-error" class="error"></p>
        <p id="tx-success" class="success"></p>
      </div>

      <!-- Contract Interaction -->
      <div id="contract-section">
        <h2>Contract Interaction</h2>
        <input type="text" id="contract-address" placeholder="Contract Address (0x...)" />
        <input type="text" id="function-name" placeholder="Function Name" />
        <input type="text" id="function-params" placeholder="Parameters (comma-separated)" />
        <button id="call-contract">Call Contract</button>
        <p id="contract-error" class="error"></p>
        <p id="contract-result" class="success"></p>
      </div>
    </body>
    </html>
  `);

  // Add event handlers and Web3 integration
  await page.evaluate(() => {
    // Error display helper
    function showError(elementId, message) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
      }
    }

    // Success display helper
    function showSuccess(elementId, message) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = message;
        element.style.display = 'block';
      }
    }

    // Input validation
    function validateAddress(address) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    function validateAmount(amount) {
      return !isNaN(amount) && parseFloat(amount) > 0;
    }

    // Wallet connection
    document.getElementById('connect-wallet')?.addEventListener('click', async () => {
      try {
        if (!window.ethereum) {
          throw new Error('No Web3 provider found');
        }

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts[0]) {
          document.getElementById('wallet-address').textContent = 
            `Connected: ${accounts[0]}`;
        }
      } catch (error) {
        showError('connection-error', error.message);
      }
    });

    // Transaction sending
    document.getElementById('send-tx')?.addEventListener('click', async () => {
      try {
        const recipient = document.getElementById('recipient').value;
        const amount = document.getElementById('amount').value;

        if (!validateAddress(recipient)) {
          throw new Error('Invalid recipient address');
        }

        if (!validateAmount(amount)) {
          throw new Error('Invalid amount');
        }

        if (!window.ethereum?.selectedAddress) {
          throw new Error('Please connect your wallet first');
        }

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: window.ethereum.selectedAddress,
            to: recipient,
            value: '0x' + (parseFloat(amount) * 1e18).toString(16),
            chainId: window.ethereum.chainId
          }]
        });

        showSuccess('tx-success', `Transaction sent: ${txHash}`);
      } catch (error) {
        showError('tx-error', error.message);
      }
    });

    // Contract interaction
    document.getElementById('call-contract')?.addEventListener('click', async () => {
      try {
        const contractAddress = document.getElementById('contract-address').value;
        const functionName = document.getElementById('function-name').value;
        const functionParams = document.getElementById('function-params').value;

        if (!validateAddress(contractAddress)) {
          throw new Error('Invalid contract address');
        }

        if (!functionName) {
          throw new Error('Function name is required');
        }

        // Basic ABI encoding (simplified)
        const params = functionParams ? functionParams.split(',') : [];
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: `0x${functionName}${params.join('')}`
          }]
        });

        showSuccess('contract-result', `Result: ${result}`);
      } catch (error) {
        showError('contract-error', error.message);
      }
    });
  });
}

module.exports = {
  setupTestPageWithUI
}; 