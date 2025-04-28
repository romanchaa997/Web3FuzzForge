/**
 * Security scanner utilities for Web3FuzzForge
 * These utilities help detect common security vulnerabilities in Web3 applications
 */

const ethers = require('ethers');

/**
 * Setup transaction interception to analyze transactions
 * @param {import('playwright').Page} page - Playwright page object
 */
async function interceptTransactions(page) {
  // Setup network interception
  await page.route('**/eth_sendTransaction', async (route) => {
    const request = route.request();
    const postData = request.postData();
    
    // Store the transaction data for later analysis
    global.__latestTransaction = JSON.parse(postData);
    
    // Allow the transaction to proceed
    await route.continue();
  });
  
  // Also intercept contract calls
  await page.route('**/eth_call', async (route) => {
    const request = route.request();
    const postData = request.postData();
    
    // Store the call data for later analysis
    if (!global.__contractCalls) {
      global.__contractCalls = [];
    }
    global.__contractCalls.push(JSON.parse(postData));
    
    // Allow the call to proceed
    await route.continue();
  });
}

/**
 * Analyze transaction for potential reentrancy vulnerabilities
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Object} Analysis results
 */
async function analyzeTxForReentrancy(page) {
  const result = {
    hasReentrancyProtection: false,
    stateChangesBeforeCalls: false,
    usesReentrancyGuard: false,
    callSequence: []
  };
  
  // Get the transaction data
  const txData = global.__latestTransaction;
  if (!txData || !txData.params || !txData.params[0]) {
    console.warn('No transaction data found for analysis');
    return result;
  }
  
  const transaction = txData.params[0];
  const data = transaction.data;
  
  // Check for reentrancy guard pattern (nonReentrant modifier)
  // This is a basic check for the function signature of a nonReentrant modifier
  if (data && data.includes('0x8d8f5dc8')) {
    result.usesReentrancyGuard = true;
  }
  
  // Analyze the contract calls sequence
  const calls = global.__contractCalls || [];
  if (calls.length > 0) {
    // Map the call sequence to understand the flow
    result.callSequence = calls.map(call => {
      return {
        selector: call.params && call.params[0] && call.params[0].data ? 
          call.params[0].data.substring(0, 10) : null,
        to: call.params && call.params[0] ? call.params[0].to : null
      };
    });
    
    // Check for state modifications before external calls
    // This is a heuristic and would need to be refined for production use
    const stateGetCalls = calls.filter(call => 
      call.method === 'eth_call' && 
      call.params && 
      call.params[0] && 
      call.params[0].data && 
      call.params[0].data.includes('0x')
    );
    
    const stateSetCalls = calls.filter(call => 
      call.method === 'eth_sendTransaction' && 
      call.params && 
      call.params[0] && 
      call.params[0].data
    );
    
    // Simple heuristic: check if state reads happen before writes
    if (stateGetCalls.length > 0 && stateSetCalls.length > 0) {
      const firstGetTimestamp = stateGetCalls[0].timestamp || 0;
      const firstSetTimestamp = stateSetCalls[0].timestamp || Infinity;
      
      result.stateChangesBeforeCalls = firstSetTimestamp < firstGetTimestamp;
    }
  }
  
  // Combined assessment
  result.hasReentrancyProtection = result.usesReentrancyGuard || result.stateChangesBeforeCalls;
  
  return result;
}

/**
 * Detect unlimited token approvals in ERC20 transactions
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Object} Analysis results
 */
async function detectUnlimitedApprovals(page) {
  const result = {
    hasUnlimitedApproval: false,
    approvalAmount: "0",
    spender: null
  };
  
  // Get the transaction data
  const txData = global.__latestTransaction;
  if (!txData || !txData.params || !txData.params[0]) {
    console.warn('No transaction data found for analysis');
    return result;
  }
  
  const transaction = txData.params[0];
  const data = transaction.data;
  
  // Check if this is an ERC20 approve call (function signature for approve: 0x095ea7b3)
  if (data && data.startsWith('0x095ea7b3')) {
    // Parse the approve function data (approve(address spender, uint256 amount))
    const approveData = data.substring(10); // Remove function selector
    
    // First 32 bytes after selector is the spender address (padded)
    const spenderHex = `0x${approveData.substring(24, 64)}`;
    result.spender = spenderHex;
    
    // Next 32 bytes is the amount
    const amountHex = `0x${approveData.substring(64, 128)}`;
    result.approvalAmount = ethers.BigNumber.from(amountHex).toString();
    
    // Check if amount is max uint256 (unlimited approval)
    // max uint256 = 2^256 - 1 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
    if (amountHex === '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') {
      result.hasUnlimitedApproval = true;
    }
  }
  
  return result;
}

/**
 * Detect front-running vulnerabilities
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Object} Analysis results
 */
async function detectFrontRunningVulnerabilities(page) {
  const result = {
    hasFrontRunningProtection: false,
    usesCommitReveal: false,
    hasTimelock: false,
    vulnerabilityDetails: []
  };
  
  // Get the transaction data
  const txData = global.__latestTransaction;
  if (!txData || !txData.params || !txData.params[0]) {
    console.warn('No transaction data found for analysis');
    return result;
  }
  
  const transaction = txData.params[0];
  
  // Check if gas price is specified or left to default (potential for front-running)
  if (!transaction.gasPrice) {
    result.vulnerabilityDetails.push('No gas price specified, vulnerable to gas price manipulation');
  }
  
  // Check for commit-reveal pattern (common front-running protection)
  // This is a basic check for function signatures commonly used in commit-reveal patterns
  if (transaction.data && 
      (transaction.data.includes('0x2b4e91b') || // commit
       transaction.data.includes('0xb2f1de2'))) { // reveal
    result.usesCommitReveal = true;
  }
  
  // Check for timelock pattern
  if (transaction.data && transaction.data.includes('0xc4d67c8')) { // queue function common in timelock contracts
    result.hasTimelock = true;
  }
  
  // Combined assessment
  result.hasFrontRunningProtection = result.usesCommitReveal || result.hasTimelock;
  
  return result;
}

module.exports = {
  interceptTransactions,
  analyzeTxForReentrancy,
  detectUnlimitedApprovals,
  detectFrontRunningVulnerabilities
}; 