import { ethers } from 'ethers';

// ABI for basic ERC20 operations (simplified)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// State management
const state = {
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  networkName: null,
  connected: false
};

// DOM Elements
const connectButton = document.getElementById('connect-wallet');
const walletInfo = document.getElementById('wallet-info');
const walletAddress = document.getElementById('wallet-address');
const networkName = document.getElementById('network-name');
const chainIdElement = document.getElementById('chain-id');
const transactionSection = document.getElementById('transaction-section');
const signingSection = document.getElementById('signing-section');
const securitySection = document.getElementById('security-section');
const sendTransactionBtn = document.getElementById('send-transaction');
const tokenTransferBtn = document.getElementById('token-transfer');
const signMessageBtn = document.getElementById('sign-message');
const signTypedDataBtn = document.getElementById('sign-typed-data');
const executeVulnerableBtn = document.getElementById('execute-vulnerable');
const multipleApprovalsBtn = document.getElementById('request-multiple-approvals');
const transactionResult = document.getElementById('transaction-result');
const signatureResult = document.getElementById('signature-result');
const errorResult = document.getElementById('error-result');

// Initialize
function init() {
  // Check if Web3 is available
  if (!window.ethereum) {
    showError('Web3 provider not detected. Please install MetaMask or another Web3 wallet.');
    return;
  }

  // Setup event listeners
  setupEventListeners();
}

// Setup UI event listeners
function setupEventListeners() {
  connectButton.addEventListener('click', connectWallet);
  sendTransactionBtn.addEventListener('click', sendTransaction);
  tokenTransferBtn.addEventListener('click', transferTokens);
  signMessageBtn.addEventListener('click', signMessage);
  signTypedDataBtn.addEventListener('click', signTypedData);
  executeVulnerableBtn.addEventListener('click', executeVulnerableFunction);
  multipleApprovalsBtn.addEventListener('click', requestMultipleApprovals);

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', handleChainChange);
    window.ethereum.on('disconnect', handleDisconnect);
  }
}

// Connect wallet function
async function connectWallet() {
  try {
    resetUI();
    showLoading(connectButton, 'Connecting...');

    // Create a ethers.js provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    
    // Update state
    state.provider = provider;
    state.signer = signer;
    state.address = address;
    state.chainId = chainId;
    state.networkName = network.name === 'homestead' ? 'Ethereum Mainnet' : network.name;
    state.connected = true;

    // Update UI
    walletAddress.textContent = formatAddress(address);
    networkName.textContent = state.networkName;
    chainIdElement.textContent = chainId.toString();
    
    walletInfo.classList.remove('hidden');
    transactionSection.classList.remove('hidden');
    signingSection.classList.remove('hidden');
    securitySection.classList.remove('hidden');
    
    connectButton.textContent = 'Wallet Connected';
    connectButton.disabled = true;
    
    console.log('Connected to wallet:', address);
  } catch (error) {
    console.error('Error connecting wallet:', error);
    showError(`Failed to connect wallet: ${error.message}`);
    connectButton.textContent = 'Connect Wallet';
    connectButton.disabled = false;
  }
}

// Send a simple ETH transaction
async function sendTransaction() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(sendTransactionBtn, 'Sending...');
    
    const amount = document.getElementById('eth-amount').value;
    const recipient = document.getElementById('recipient-address').value;
    
    if (!amount || !recipient) {
      throw new Error('Please provide both amount and recipient address');
    }
    
    if (!ethers.isAddress(recipient)) {
      throw new Error('Invalid recipient address');
    }
    
    // Prepare transaction
    const tx = {
      to: recipient,
      value: ethers.parseEther(amount)
    };
    
    // Send transaction
    const txResponse = await state.signer.sendTransaction(tx);
    
    // Show result
    transactionResult.innerHTML = `
      <h3>Transaction Sent</h3>
      <p>Transaction Hash: ${txResponse.hash}</p>
      <p>From: ${txResponse.from}</p>
      <p>To: ${recipient}</p>
      <p>Amount: ${amount} ETH</p>
      <p>Status: Pending - <a href="https://etherscan.io/tx/${txResponse.hash}" target="_blank">View on Etherscan</a></p>
    `;
    transactionResult.classList.remove('hidden');
    
    // Wait for transaction to be mined
    const receipt = await txResponse.wait();
    
    // Update status
    const statusElement = transactionResult.querySelector('p:last-child');
    statusElement.innerHTML = `Status: ${receipt.status === 1 ? 'Confirmed' : 'Failed'} - <a href="https://etherscan.io/tx/${txResponse.hash}" target="_blank">View on Etherscan</a>`;
    
  } catch (error) {
    console.error('Transaction error:', error);
    showError(`Transaction failed: ${error.message}`);
  } finally {
    sendTransactionBtn.textContent = 'Send Transaction';
    sendTransactionBtn.disabled = false;
  }
}

// Transfer ERC20 tokens
async function transferTokens() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(tokenTransferBtn, 'Transferring...');
    
    const tokenAddress = document.getElementById('token-address').value;
    const recipient = document.getElementById('token-recipient').value;
    const amount = document.getElementById('token-amount').value;
    
    if (!tokenAddress || !recipient || !amount) {
      throw new Error('Please provide token address, recipient address and amount');
    }
    
    if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(recipient)) {
      throw new Error('Invalid address provided');
    }
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, state.signer);
    
    // Send transaction
    const txResponse = await tokenContract.transfer(recipient, amount);
    
    // Show result
    transactionResult.innerHTML = `
      <h3>Token Transfer Initiated</h3>
      <p>Transaction Hash: ${txResponse.hash}</p>
      <p>Token Address: ${tokenAddress}</p>
      <p>Recipient: ${recipient}</p>
      <p>Amount: ${amount} tokens</p>
      <p>Status: Pending - <a href="https://etherscan.io/tx/${txResponse.hash}" target="_blank">View on Etherscan</a></p>
    `;
    transactionResult.classList.remove('hidden');
    
    // Wait for transaction to be mined
    const receipt = await txResponse.wait();
    
    // Update status
    const statusElement = transactionResult.querySelector('p:last-child');
    statusElement.innerHTML = `Status: ${receipt.status === 1 ? 'Confirmed' : 'Failed'} - <a href="https://etherscan.io/tx/${txResponse.hash}" target="_blank">View on Etherscan</a>`;
    
  } catch (error) {
    console.error('Token transfer error:', error);
    showError(`Token transfer failed: ${error.message}`);
  } finally {
    tokenTransferBtn.textContent = 'Transfer Tokens';
    tokenTransferBtn.disabled = false;
  }
}

// Sign a message
async function signMessage() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(signMessageBtn, 'Signing...');
    
    const message = document.getElementById('message-to-sign').value;
    
    if (!message) {
      throw new Error('Please provide a message to sign');
    }
    
    // Sign the message
    const signature = await state.signer.signMessage(message);
    
    // Show result
    signatureResult.innerHTML = `
      <h3>Message Signed</h3>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Signature:</strong> ${signature}</p>
      <p><strong>Signer:</strong> ${state.address}</p>
    `;
    signatureResult.classList.remove('hidden');
    
  } catch (error) {
    console.error('Signing error:', error);
    showError(`Signing failed: ${error.message}`);
  } finally {
    signMessageBtn.textContent = 'Sign Message';
    signMessageBtn.disabled = false;
  }
}

// Sign typed data (EIP-712)
async function signTypedData() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(signTypedDataBtn, 'Signing...');
    
    // EIP-712 typed data
    const domain = {
      name: 'Demo dApp',
      version: '1',
      chainId: state.chainId,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
    };
    
    const types = {
      Authorization: [
        { name: 'action', type: 'string' },
        { name: 'timestamp', type: 'uint256' }
      ]
    };
    
    const value = {
      action: 'Access Request',
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    // Sign the data
    const signature = await state.signer.signTypedData(domain, types, value);
    
    // Show result
    signatureResult.innerHTML = `
      <h3>Typed Data Signed</h3>
      <p><strong>Domain:</strong> ${domain.name} v${domain.version}</p>
      <p><strong>Action:</strong> ${value.action}</p>
      <p><strong>Timestamp:</strong> ${value.timestamp}</p>
      <p><strong>Signature:</strong> ${signature}</p>
      <p><strong>Signer:</strong> ${state.address}</p>
    `;
    signatureResult.classList.remove('hidden');
    
  } catch (error) {
    console.error('Typed data signing error:', error);
    showError(`Typed data signing failed: ${error.message}`);
  } finally {
    signTypedDataBtn.textContent = 'Sign Typed Data';
    signTypedDataBtn.disabled = false;
  }
}

// Example of a vulnerable function (for security testing)
async function executeVulnerableFunction() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(executeVulnerableBtn, 'Executing...');
    
    // This function simulates a security vulnerability where multiple
    // transactions are initiated without proper user confirmation
    
    // First transaction
    const tx1 = {
      to: state.address,
      value: ethers.parseEther('0')
    };
    
    // Send first transaction
    await state.signer.sendTransaction(tx1);
    
    // Without waiting for user confirmation, immediately request another
    const tokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH
    const spender = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Uniswap V2 Router
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, state.signer);
    
    // Request token approval (unlimited)
    const maxApproval = ethers.MaxUint256;
    const approvalTx = await tokenContract.approve(spender, maxApproval);
    
    // Show result
    transactionResult.innerHTML = `
      <h3>⚠️ Vulnerable Function Executed</h3>
      <p>This test simulates a security vulnerability where multiple high-risk transactions are initiated without clear user consent.</p>
      <p>Last Transaction Hash: ${approvalTx.hash}</p>
      <p>Approved: WETH</p>
      <p>Spender: Uniswap V2 Router</p>
      <p>Amount: Unlimited</p>
      <p>Status: Pending</p>
    `;
    transactionResult.classList.remove('hidden');
    
  } catch (error) {
    console.error('Vulnerable function error:', error);
    showError(`Error: ${error.message}`);
  } finally {
    executeVulnerableBtn.textContent = 'Execute Vulnerable Function';
    executeVulnerableBtn.disabled = false;
  }
}

// Request multiple approvals in sequence
async function requestMultipleApprovals() {
  if (!state.connected) return showError('Please connect your wallet first');
  
  try {
    resetResults();
    showLoading(multipleApprovalsBtn, 'Requesting...');
    
    // List of tokens to request approvals for
    const tokenAddresses = [
      { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'WETH' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USDC' },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'DAI' }
    ];
    
    const spender = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Uniswap V2 Router
    const results = [];
    
    for (const token of tokenAddresses) {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, state.signer);
      
      // Request token approval (100 units)
      const approvalAmount = 100;
      const tx = await tokenContract.approve(spender, approvalAmount);
      
      results.push({
        token: token.name,
        address: token.address,
        hash: tx.hash
      });
    }
    
    // Show results
    let resultHTML = `
      <h3>⚠️ Multiple Approvals Requested</h3>
      <p>This test simulates requesting multiple token approvals in sequence.</p>
    `;
    
    results.forEach((result, index) => {
      resultHTML += `
        <p><strong>Approval ${index + 1}:</strong> ${result.token} (${result.address})</p>
        <p>Transaction: ${result.hash}</p>
      `;
    });
    
    transactionResult.innerHTML = resultHTML;
    transactionResult.classList.remove('hidden');
    
  } catch (error) {
    console.error('Multiple approvals error:', error);
    showError(`Error requesting approvals: ${error.message}`);
  } finally {
    multipleApprovalsBtn.textContent = 'Request Multiple Approvals';
    multipleApprovalsBtn.disabled = false;
  }
}

// Event Handlers
function handleAccountChange(accounts) {
  console.log('Account changed:', accounts);
  if (accounts.length === 0) {
    handleDisconnect();
  } else if (state.address !== accounts[0] && state.connected) {
    state.address = accounts[0];
    walletAddress.textContent = formatAddress(accounts[0]);
  }
}

function handleChainChange(chainIdHex) {
  console.log('Chain changed:', chainIdHex);
  window.location.reload();
}

function handleDisconnect() {
  console.log('Disconnected from wallet');
  resetUI();
  showError('Wallet disconnected');
}

// Helper Functions
function formatAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function showLoading(button, text) {
  button.textContent = text;
  button.disabled = true;
}

function showError(message) {
  errorResult.textContent = message;
  errorResult.classList.remove('hidden');
  setTimeout(() => {
    errorResult.classList.add('hidden');
  }, 5000);
}

function resetResults() {
  transactionResult.classList.add('hidden');
  signatureResult.classList.add('hidden');
  errorResult.classList.add('hidden');
}

function resetUI() {
  walletInfo.classList.add('hidden');
  transactionSection.classList.add('hidden');
  signingSection.classList.add('hidden');
  securitySection.classList.add('hidden');
  resetResults();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init); 