#!/usr/bin/env node

/**
 * Web3FuzzForge Cross-Chain Testing Setup
 * 
 * This script sets up the necessary directories and files for cross-chain testing.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const rootDir = path.resolve(__dirname, '..', '..');
const testsDir = path.join(rootDir, 'tests', 'cross-chain');
const templatesDir = path.join(rootDir, 'templates', 'cross-chain');

// Chain configurations
const chains = {
  ethereum: {
    name: 'Ethereum',
    chainId: '0x1',
    testnet: {
      name: 'Sepolia',
      chainId: '0xaa36a7',
      rpcUrl: 'https://sepolia.infura.io/v3/${INFURA_API_KEY}',
      blockExplorer: 'https://sepolia.etherscan.io'
    }
  },
  polygon: {
    name: 'Polygon',
    chainId: '0x89',
    testnet: {
      name: 'Mumbai',
      chainId: '0x13881',
      rpcUrl: 'https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}',
      blockExplorer: 'https://mumbai.polygonscan.com'
    }
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: '0xa4b1',
    testnet: {
      name: 'Arbitrum Goerli',
      chainId: '0x66eed',
      rpcUrl: 'https://arbitrum-goerli.infura.io/v3/${INFURA_API_KEY}',
      blockExplorer: 'https://goerli.arbiscan.io'
    }
  },
  optimism: {
    name: 'Optimism',
    chainId: '0xa',
    testnet: {
      name: 'Optimism Goerli',
      chainId: '0x1a4',
      rpcUrl: 'https://optimism-goerli.infura.io/v3/${INFURA_API_KEY}',
      blockExplorer: 'https://goerli-optimism.etherscan.io'
    }
  },
  bsc: {
    name: 'BNB Chain',
    chainId: '0x38',
    testnet: {
      name: 'BSC Testnet',
      chainId: '0x61',
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      blockExplorer: 'https://testnet.bscscan.com'
    }
  },
  avalanche: {
    name: 'Avalanche',
    chainId: '0xa86a',
    testnet: {
      name: 'Fuji',
      chainId: '0xa869',
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      blockExplorer: 'https://testnet.snowtrace.io'
    }
  }
};

async function main() {
  console.log(chalk.blue('Setting up cross-chain testing environment...'));
  
  // Create directories if they don't exist
  fs.ensureDirSync(testsDir);
  fs.ensureDirSync(templatesDir);
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedChains',
      message: 'Select chains to include in testing:',
      choices: Object.keys(chains).map(key => ({
        name: chains[key].name,
        value: key
      })),
      validate: input => input.length > 0 ? true : 'Please select at least one chain'
    },
    {
      type: 'confirm',
      name: 'useTestnets',
      message: 'Use testnets for development?',
      default: true
    },
    {
      type: 'confirm',
      name: 'setupBridgeTesting',
      message: 'Include bridge testing between chains?',
      default: true
    }
  ]);
  
  // Create chain configuration file
  const chainConfig = {};
  answers.selectedChains.forEach(chain => {
    chainConfig[chain] = {
      ...chains[chain],
      useTestnet: answers.useTestnets
    };
  });
  
  const configPath = path.join(rootDir, '.web3fuzzforge-chains.json');
  fs.writeFileSync(configPath, JSON.stringify(chainConfig, null, 2));
  console.log(chalk.green(`Chain configuration saved to ${configPath}`));
  
  // Create test templates
  createTestTemplates(answers.selectedChains, answers.useTestnets, answers.setupBridgeTesting);
  
  // Create README
  createReadme(answers.selectedChains, answers.useTestnets, answers.setupBridgeTesting);
  
  console.log(chalk.green.bold('Cross-chain testing setup complete!'));
  console.log(chalk.yellow('Run the tests with:'));
  console.log(chalk.cyan('  npm run cross-chain:test'));
}

function createTestTemplates(selectedChains, useTestnets, setupBridgeTesting) {
  // Create network switching test
  const networkSwitchingTest = `
const { test, expect } = require('@playwright/test');
const { setupWalletState } = require('../../src/utils/wallet-state');

test.describe('Network Switching Tests', () => {
  test('should switch between different networks gracefully', async ({ page }) => {
    // Setup wallet state
    await setupWalletState(page);
    
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Connect wallet
    await page.click('#connect-wallet');
    await page.waitForSelector('[data-testid="connected-status"]');
    
    ${selectedChains.map(chain => {
      const network = useTestnets ? chains[chain].testnet : chains[chain];
      return `
    // Switch to ${network.name}
    console.log('Switching to ${network.name}...');
    await page.evaluate(chainId => {
      return window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
    }, '${network.chainId}');
    
    // Verify chain switched successfully
    const currentChainId = await page.evaluate(() => window.ethereum.request({ method: 'eth_chainId' }));
    expect(currentChainId).toBe('${network.chainId}');
    
    // Check that dApp UI updated correctly
    await page.waitForSelector('[data-testid="network-${chain}"], [data-testid="chain-${network.chainId}"]', { timeout: 5000 }).catch(() => {
      console.log('Network indicator not found, but continuing test...');
    });
    
    // Perform basic interaction on this network
    await page.click('#refresh-balance').catch(() => {});`;
    }).join('\n')}
  });
});
`;

  fs.writeFileSync(path.join(testsDir, 'network-switching.spec.js'), networkSwitchingTest);
  console.log(chalk.green('Created network switching test'));
  
  // Create state consistency test
  const stateConsistencyTest = `
const { test, expect } = require('@playwright/test');
const { setupWalletState } = require('../../src/utils/wallet-state');

test.describe('Cross-Chain State Consistency Tests', () => {
  test('should maintain consistent state across networks', async ({ page }) => {
    // Setup wallet state with the same address across chains
    const walletState = await setupWalletState(page, {
      address: '0x1234567890123456789012345678901234567890'
    });
    
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Connect wallet
    await page.click('#connect-wallet');
    await page.waitForSelector('[data-testid="connected-status"]');
    
    // Get wallet address displayed in UI
    const displayedAddress = await page.textContent('[data-testid="wallet-address"]');
    const normalizedDisplayedAddress = displayedAddress.toLowerCase().replace(/^0x/, '');
    const normalizedWalletAddress = walletState.selectedAddress.toLowerCase().replace(/^0x/, '');
    
    // Verify address is displayed correctly
    expect(normalizedDisplayedAddress).toContain(normalizedWalletAddress.substring(0, 6));
    
    // Test state consistency across networks
    ${selectedChains.map(chain => {
      const network = useTestnets ? chains[chain].testnet : chains[chain];
      return `
    // Switch to ${network.name}
    console.log('Checking state consistency on ${network.name}...');
    await page.evaluate(chainId => {
      return window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
    }, '${network.chainId}');
    
    // Verify address remains consistent after network switch
    const addressAfterSwitch = await page.textContent('[data-testid="wallet-address"]');
    expect(addressAfterSwitch.toLowerCase()).toContain(normalizedWalletAddress.substring(0, 6));`;
    }).join('\n')}
  });
});
`;

  fs.writeFileSync(path.join(testsDir, 'state-consistency.spec.js'), stateConsistencyTest);
  console.log(chalk.green('Created state consistency test'));
  
  // Create bridge test if requested
  if (setupBridgeTesting && selectedChains.length >= 2) {
    const sourceChain = selectedChains[0];
    const destChain = selectedChains[1];
    const sourceName = useTestnets ? chains[sourceChain].testnet.name : chains[sourceChain].name;
    const destName = useTestnets ? chains[destChain].testnet.name : chains[destChain].name;
    
    const bridgeTest = `
const { test, expect } = require('@playwright/test');
const { setupWalletState } = require('../../src/utils/wallet-state');

test.describe('Cross-Chain Bridge Tests', () => {
  test('should complete bridge transaction between ${sourceName} and ${destName}', async ({ page }) => {
    // This test is a simulation of bridge interaction
    // In a real test, you would interact with an actual bridge interface
    
    // Setup wallet with sufficient balance
    await setupWalletState(page, {
      balance: '1000000000000000000' // 1 ETH equivalent
    });
    
    // Navigate to bridge interface
    await page.goto(process.env.BRIDGE_URL || 'https://your-bridge-app.com');
    
    // Connect wallet
    await page.click('#connect-wallet');
    await page.waitForSelector('[data-testid="connected-status"]');
    
    // Select source chain (${sourceName})
    await page.selectOption('#source-chain', '${sourceChain}');
    
    // Select destination chain (${destName})
    await page.selectOption('#destination-chain', '${destChain}');
    
    // Enter amount to bridge
    await page.fill('#bridge-amount', '0.01');
    
    // Initiate bridge transaction
    await page.click('#bridge-button');
    
    // Approve transaction in wallet
    await page.waitForSelector('[data-testid="confirm-transaction"]');
    await page.click('[data-testid="confirm-transaction"]');
    
    // Wait for transaction confirmation
    await page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 30000 });
    
    // Verify bridge transaction initiated
    const initiationStatus = await page.textContent('[data-testid="bridge-status"]');
    expect(initiationStatus).toContain('Processing');
    
    // Note: In a real test, you would either:
    // 1. Mock the bridge completion
    // 2. Wait for the actual bridge to complete (can take minutes/hours)
    // 3. Check for the transaction hash on the source chain
    
    // For this example, we'll simulate successful initiation
    console.log('Bridge transaction successfully initiated');
  });
});
`;
    
    fs.writeFileSync(path.join(testsDir, 'bridge-transaction.spec.js'), bridgeTest);
    console.log(chalk.green('Created bridge transaction test'));
  }
}

function createReadme(selectedChains, useTestnets, setupBridgeTesting) {
  const readmeContent = `# Cross-Chain Testing

This directory contains automated tests for cross-chain functionality.

## Included Tests

- **Network Switching Tests**: Verify dApp behavior when switching between different networks
- **State Consistency Tests**: Ensure user state remains consistent across networks
${setupBridgeTesting ? '- **Bridge Transaction Tests**: Test cross-chain bridge functionality\n' : ''}

## Configured Networks

${selectedChains.map(chain => {
  const network = useTestnets ? chains[chain].testnet : chains[chain];
  return `- **${network.name}** (Chain ID: \`${network.chainId}\`)`;
}).join('\n')}

## Running the Tests

\`\`\`bash
# Run all cross-chain tests
npm run cross-chain:test

# Run specific test file
npx playwright test tests/cross-chain/network-switching.spec.js --headed
\`\`\`

## Configuration

The chain configuration is stored in \`.web3fuzzforge-chains.json\`. You can modify this file to add or remove chains.

## Prerequisites

- Make sure your dApp supports the chains you're testing
- For bridge tests, you need a working bridge interface or mock
- Environment variables should be configured in your \`.env\` file:
  - \`DAPP_URL\`: URL of the dApp to test
  - \`BRIDGE_URL\`: URL of the bridge interface (for bridge tests)
  - \`INFURA_API_KEY\`: Your Infura API key (for RPC URLs)

`;

  fs.writeFileSync(path.join(testsDir, 'README.md'), readmeContent);
  console.log(chalk.green('Created README for cross-chain tests'));
}

main().catch(error => {
  console.error(chalk.red('Error setting up cross-chain testing:'));
  console.error(error);
  process.exit(1);
}); 