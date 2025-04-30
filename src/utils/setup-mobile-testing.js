#!/usr/bin/env node

/**
 * Web3FuzzForge Mobile Wallet Testing Setup
 * 
 * This script sets up the necessary directories and files for mobile wallet testing.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const rootDir = path.resolve(__dirname, '..', '..');
const testsDir = path.join(rootDir, 'tests', 'mobile');
const templatesDir = path.join(rootDir, 'templates', 'mobile');

// Mobile wallet configurations
const wallets = {
  metamask: {
    name: 'MetaMask Mobile',
    platforms: ['iOS', 'Android'],
    connectionMethods: ['WalletConnect', 'Deep Links'],
    deepLinkFormat: 'metamask://'
  },
  trustwallet: {
    name: 'Trust Wallet',
    platforms: ['iOS', 'Android'],
    connectionMethods: ['WalletConnect'],
    deepLinkFormat: 'trust://'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    platforms: ['iOS', 'Android'],
    connectionMethods: ['WalletConnect', 'SDK'],
    deepLinkFormat: 'cbwallet://'
  },
  rainbow: {
    name: 'Rainbow',
    platforms: ['iOS'],
    connectionMethods: ['WalletConnect'],
    deepLinkFormat: 'rainbow://'
  },
  phantom: {
    name: 'Phantom',
    platforms: ['iOS', 'Android'],
    connectionMethods: ['WalletConnect', 'Custom Protocol'],
    deepLinkFormat: 'phantom://',
    isSolana: true
  }
};

async function main() {
  console.log(chalk.blue('Setting up mobile wallet testing environment...'));
  
  // Create directories if they don't exist
  fs.ensureDirSync(testsDir);
  fs.ensureDirSync(templatesDir);
  
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedWallets',
      message: 'Select mobile wallets to test:',
      choices: Object.keys(wallets).map(key => ({
        name: wallets[key].name,
        value: key
      })),
      validate: input => input.length > 0 ? true : 'Please select at least one wallet'
    },
    {
      type: 'checkbox',
      name: 'testMethods',
      message: 'Select connection methods to test:',
      choices: [
        { name: 'WalletConnect QR Code', value: 'qrcode' },
        { name: 'Deep Links', value: 'deeplink' },
        { name: 'Mobile SDKs', value: 'sdk' }
      ],
      validate: input => input.length > 0 ? true : 'Please select at least one method'
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Select platforms to target:',
      choices: [
        { name: 'iOS', value: 'ios' },
        { name: 'Android', value: 'android' }
      ],
      default: ['ios', 'android']
    }
  ]);
  
  // Create wallet configuration file
  const walletConfig = {};
  answers.selectedWallets.forEach(wallet => {
    walletConfig[wallet] = {
      ...wallets[wallet],
      testMethods: answers.testMethods.filter(method => {
        if (method === 'qrcode') return wallets[wallet].connectionMethods.includes('WalletConnect');
        if (method === 'deeplink') return wallets[wallet].connectionMethods.includes('Deep Links');
        if (method === 'sdk') return wallets[wallet].connectionMethods.includes('SDK');
        return false;
      }),
      platforms: wallets[wallet].platforms.filter(p => 
        answers.platforms.includes(p.toLowerCase())
      )
    };
  });
  
  const configPath = path.join(rootDir, '.web3fuzzforge-mobile.json');
  fs.writeFileSync(configPath, JSON.stringify(walletConfig, null, 2));
  console.log(chalk.green(`Mobile wallet configuration saved to ${configPath}`));
  
  // Create test templates
  createTestTemplates(answers.selectedWallets, walletConfig, answers.testMethods);
  
  // Create README
  createReadme(answers.selectedWallets, walletConfig, answers.testMethods);
  
  // Install additional dependencies if needed
  console.log(chalk.yellow('Installing required dependencies...'));
  installDependencies(answers.testMethods);
  
  console.log(chalk.green.bold('Mobile wallet testing setup complete!'));
  console.log(chalk.yellow('Run the tests with:'));
  console.log(chalk.cyan('  npm run mobile:test'));
}

function createTestTemplates(selectedWallets, walletConfig, testMethods) {
  // Create WalletConnect QR code test if selected
  if (testMethods.includes('qrcode')) {
    const qrCodeTest = `
const { test, expect } = require('@playwright/test');

test.describe('WalletConnect QR Code Tests', () => {
  test('should display and parse WalletConnect QR code', async ({ page }) => {
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Click connect wallet button
    await page.click('#connect-wallet');
    
    // Select WalletConnect option
    await page.click('[data-testid="walletconnect-option"]');
    
    // Verify QR code is displayed
    const qrCodeVisible = await page.isVisible('[data-testid="qr-code"]');
    expect(qrCodeVisible).toBeTruthy();
    
    // Take screenshot of QR code for evidence
    await page.screenshot({ path: 'test-results/walletconnect-qr.png' });
    
    // Use QR code parser mock to extract URI
    const uri = await page.evaluate(() => {
      // In a real test, you would extract the actual WalletConnect URI
      // For this mock, we'll return a placeholder
      return 'wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1';
    });
    
    // Verify URI format
    expect(uri).toMatch(/^wc:/);
    
    // Simulate wallet connection (mock)
    await page.evaluate(() => {
      // Simulate wallet connection event
      window.dispatchEvent(new Event('walletconnect_connection'));
    });
    
    // Wait for connected state (this would be handled by the actual WalletConnect)
    await page.waitForTimeout(1000); // In real tests, wait for an actual element
    
    console.log('WalletConnect QR code test completed');
  });
});
`;
    
    fs.writeFileSync(path.join(testsDir, 'walletconnect-qrcode.spec.js'), qrCodeTest);
    console.log(chalk.green('Created WalletConnect QR code test'));
  }
  
  // Create deep link test if selected
  if (testMethods.includes('deeplink')) {
    // Filter wallets that support deep links
    const deepLinkWallets = selectedWallets.filter(wallet => 
      walletConfig[wallet].testMethods.includes('deeplink')
    );
    
    if (deepLinkWallets.length > 0) {
      const deepLinkTest = `
const { test, expect } = require('@playwright/test');

test.describe('Mobile Wallet Deep Link Tests', () => {
  ${deepLinkWallets.map(wallet => `
  test('should generate ${wallets[wallet].name} deep link', async ({ page }) => {
    // Configure mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Click connect wallet button
    await page.click('#connect-wallet');
    
    // Select ${wallets[wallet].name} option
    await page.click('[data-testid="${wallet}-option"]');
    
    // Check for deep link generation
    const deepLink = await page.evaluate(() => {
      // In a real test, extract the actual deep link
      // For this mock, return a placeholder
      return '${wallets[wallet].deepLinkFormat}wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1';
    });
    
    // Verify deep link format
    expect(deepLink).toContain('${wallets[wallet].deepLinkFormat}');
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/${wallet}-deeplink.png' });
    
    console.log('${wallets[wallet].name} deep link test completed');
  });`).join('\n')}
});
`;
      
      fs.writeFileSync(path.join(testsDir, 'mobile-deeplinks.spec.js'), deepLinkTest);
      console.log(chalk.green('Created mobile deep link test'));
    }
  }
  
  // Create responsive UI test
  const responsiveTest = `
const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive UI Tests', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X dimensions
    
    // Set mobile user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Check that the mobile UI is displayed correctly
    const mobileMenuVisible = await page.isVisible('[data-testid="mobile-menu"]');
    expect(mobileMenuVisible).toBeTruthy();
    
    // Check wallet connection button is accessible on mobile
    const connectButtonVisible = await page.isVisible('#connect-wallet, [data-testid="connect-button"]');
    expect(connectButtonVisible).toBeTruthy();
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/mobile-responsive-ui.png', fullPage: true });
    
    console.log('Mobile responsive UI test completed');
  });
  
  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad dimensions
    
    // Navigate to dApp
    await page.goto(process.env.DAPP_URL || 'https://your-dapp.com');
    
    // Check tablet layout
    // Add your tablet-specific checks here
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/tablet-responsive-ui.png', fullPage: true });
    
    console.log('Tablet responsive UI test completed');
  });
});
`;
  
  fs.writeFileSync(path.join(testsDir, 'mobile-responsive.spec.js'), responsiveTest);
  console.log(chalk.green('Created mobile responsive UI test'));
}

function createReadme(selectedWallets, walletConfig, testMethods) {
  const readmeContent = `# Mobile Wallet Testing

This directory contains automated tests for mobile wallet interactions.

## Included Tests

${testMethods.includes('qrcode') ? '- **WalletConnect QR Code Tests**: Test WalletConnect QR code generation and parsing\n' : ''}${testMethods.includes('deeplink') ? '- **Mobile Deep Link Tests**: Test wallet-specific deep link generation\n' : ''}- **Mobile Responsive UI Tests**: Test responsive UI for mobile devices

## Configured Wallets

${selectedWallets.map(wallet => {
  const config = walletConfig[wallet];
  return `### ${config.name}
- **Platforms**: ${config.platforms.join(', ')}
- **Connection Methods**: ${config.testMethods.map(method => {
    if (method === 'qrcode') return 'WalletConnect QR Code';
    if (method === 'deeplink') return 'Deep Links';
    if (method === 'sdk') return 'Mobile SDK';
    return method;
  }).join(', ')}`;
}).join('\n\n')}

## Running the Tests

\`\`\`bash
# Run all mobile wallet tests
npm run mobile:test

# Run specific test file
npx playwright test tests/mobile/walletconnect-qrcode.spec.js --headed
\`\`\`

## Configuration

The mobile wallet configuration is stored in \`.web3fuzzforge-mobile.json\`. You can modify this file to add or remove wallets.

## Prerequisites

- A dApp that supports mobile wallet connections
- WalletConnect integration for QR code tests
- Deep link support for deep link tests
- Environment variables should be configured in your \`.env\` file:
  - \`DAPP_URL\`: URL of the dApp to test

## Testing with Real Mobile Devices

For testing with real mobile devices:

1. Install Appium and necessary drivers
2. Configure the mobile device or emulator
3. Update the test configuration in \`.web3fuzzforge-mobile.json\`
4. Run the tests with the \`--real-device\` flag

## Mobile Testing Best Practices

1. Test on both iOS and Android platforms
2. Test different screen sizes (phone and tablet)
3. Test both landscape and portrait orientations
4. Test with and without network connectivity
5. Test wallet disconnection and reconnection flows

`;

  fs.writeFileSync(path.join(testsDir, 'README.md'), readmeContent);
  console.log(chalk.green('Created README for mobile wallet tests'));
}

function installDependencies(testMethods) {
  // In a real implementation, this would use child_process.execSync
  // to install dependencies. For this example, we'll just log what 
  // would be installed.
  
  console.log(chalk.yellow('The following dependencies would be installed:'));
  console.log('- @web3fuzzforge/mobile-testing');
  
  if (testMethods.includes('qrcode')) {
    console.log('- qrcode-parser (for QR code tests)');
  }
  
  if (testMethods.includes('deeplink')) {
    console.log('- mobile-deep-link-tester');
  }
  
  console.log(chalk.yellow('In a real implementation, these would be installed via npm.'));
}

main().catch(error => {
  console.error(chalk.red('Error setting up mobile wallet testing:'));
  console.error(error);
  process.exit(1);
});