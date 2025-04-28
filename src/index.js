#!/usr/bin/env node

const { Command } = require('commander')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { ESLint } = require('eslint')
const { execSync, spawnSync } = require('child_process')
const prettier = require('prettier')
const { exec } = require('child_process')
const configValidator = require('./config-validator')
const errorHandler = require('./utils/error-handler')

const program = new Command()

program
  .name('web3fuzzforge')
  .description('Web3 test generation toolkit for dApps')
  .version('1.1.0')

program.addHelpText(
  'after',
  `
Examples:
  # Initialize a new configuration file
  web3fuzzforge init

  # Generate MetaMask connection test (JS)
  web3fuzzforge generate connect --out ./tests/metamask-connection.test.js

  # Generate TypeScript WalletConnect transaction test
  web3fuzzforge generate tx --wallet walletconnect --lang ts --out ./tests/walletconnect-tx.test.ts

  # Generate sign message test with fuzzing for security testing
  web3fuzzforge generate sign --out ./tests/sign-message.test.js --fuzz

  # Use AI to generate a config based on a description
  web3fuzzforge ask "Create a test for MetaMask wallet connecting to a Uniswap-like dApp"

  # Verify environment setup and configuration
  web3fuzzforge doctor

  # Validate the configuration file and check for missing templates
  web3fuzzforge validate

Learn more:
  https://github.com/yourusername/web3fuzzforge
`
)

// Function to replace placeholders in template files
function replacePlaceholders(templateContent, replacements) {
  let result = templateContent

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  }

  return result
}

// Security fuzzing payloads
const fuzzPayloads = {
  xss: [
    '<script>alert(1)</script>',
    '"><script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    'javascript:alert(1)',
  ],
  largeAmounts: [
    '1' + '0'.repeat(100), // 10^100
    Number.MAX_SAFE_INTEGER.toString(),
    '999999999999999999999999999999999999999',
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  ],
  ethSignPhishing: [
    'Sign this message to verify',
    'Please sign to verify your account.',
    'Click to sign and verify your wallet.',
  ],
}

// Function to inject fuzzing test cases into template
function injectFuzzingTestCases(templateContent, type, lang) {
  let fuzzContent = templateContent

  // Add XSS payloads to input fields
  if (type === 'tx' || type === 'connect') {
    const xssPayloadInjection =
      lang === 'ts'
        ? `  // Fuzz Testing: XSS Payloads
  test('should handle XSS payloads in input fields', async () => {
    for (const payload of ${JSON.stringify(fuzzPayloads.xss)}) {
      console.log(\`Testing XSS payload: \${payload}\`);
      
      // Try XSS in recipient field if available
      try {
        const recipientField = await page.locator('input[type="text"], [id*="recipient"], [class*="recipient"], [placeholder*="recipient"], [placeholder*="address"]').first();
        if (await recipientField.isVisible()) {
          await recipientField.fill(payload);
          await page.screenshot({ path: \`test-results/xss-test-recipient-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing recipient field: \${e.message}\`);
      }
      
      // Try XSS in all input fields
      try {
        const inputFields = await page.locator('input:visible').all();
        for (let i = 0; i < inputFields.length; i++) {
          const field = inputFields[i];
          await field.fill(payload);
          await page.screenshot({ path: \`test-results/xss-test-field-\${i}-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing input fields: \${e.message}\`);
      }
      
      // Try clicking buttons after injection to see if payload executes
      try {
        const buttons = await page.locator('button:visible').all();
        for (let i = 0; i < buttons.length; i++) {
          await buttons[i].click().catch(() => console.log('Button click failed, continuing...'));
        }
      } catch (e) {
        console.log(\`Error clicking buttons: \${e.message}\`);
      }
    }
  });
`
        : `  // Fuzz Testing: XSS Payloads
  test('should handle XSS payloads in input fields', async () => {
    for (const payload of ${JSON.stringify(fuzzPayloads.xss)}) {
      console.log(\`Testing XSS payload: \${payload}\`);
      
      // Try XSS in recipient field if available
      try {
        const recipientField = await page.locator('input[type="text"], [id*="recipient"], [class*="recipient"], [placeholder*="recipient"], [placeholder*="address"]').first();
        if (await recipientField.isVisible()) {
          await recipientField.fill(payload);
          await page.screenshot({ path: \`test-results/xss-test-recipient-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing recipient field: \${e.message}\`);
      }
      
      // Try XSS in all input fields
      try {
        const inputFields = await page.locator('input:visible').all();
        for (let i = 0; i < inputFields.length; i++) {
          const field = inputFields[i];
          await field.fill(payload);
          await page.screenshot({ path: \`test-results/xss-test-field-\${i}-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing input fields: \${e.message}\`);
      }
      
      // Try clicking buttons after injection to see if payload executes
      try {
        const buttons = await page.locator('button:visible').all();
        for (let i = 0; i < buttons.length; i++) {
          await buttons[i].click().catch(() => console.log('Button click failed, continuing...'));
        }
      } catch (e) {
        console.log(\`Error clicking buttons: \${e.message}\`);
      }
    }
  });
`
    fuzzContent = fuzzContent.replace(/\}\);(\s*)$/, `${xssPayloadInjection}});$1`)
  }

  // Add large amounts for DoS testing
  if (type === 'tx') {
    const largeAmountsInjection =
      lang === 'ts'
        ? `  // Fuzz Testing: Large Transaction Amounts (DoS)
  test('should handle extremely large transaction amounts (DoS vectors)', async () => {
    for (const amount of ${JSON.stringify(fuzzPayloads.largeAmounts)}) {
      console.log(\`Testing large amount: \${amount}\`);
      
      try {
        // Try to input large amount in any amount field
        const amountField = await page.locator('input[type="number"], input[type="text"], [id*="amount"], [class*="amount"], [placeholder*="amount"]').first();
        if (await amountField.isVisible()) {
          await amountField.fill(amount);
          
          // Try to send the transaction
          const sendButton = await page.locator('button:visible:has-text("Send"), button:visible:has-text("Transfer"), button:visible:has-text("Submit")').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            
            // Take a screenshot to document behavior
            await page.screenshot({ path: \`test-results/large-amount-test-\${Date.now()}.png\` });
            
            // Check for any error messages or UI behavior changes
            const errorElement = await page.locator('.error, .alert, [role="alert"]').first();
            if (await errorElement.isVisible()) {
              console.log(\`Error displayed: \${await errorElement.textContent()}\`);
            }
          }
        }
      } catch (e) {
        console.log(\`Error testing large amount: \${e.message}\`);
      }
      
      // Reset the page state if needed
      await page.reload();
    }
  });
`
        : `  // Fuzz Testing: Large Transaction Amounts (DoS)
  test('should handle extremely large transaction amounts (DoS vectors)', async () => {
    for (const amount of ${JSON.stringify(fuzzPayloads.largeAmounts)}) {
      console.log(\`Testing large amount: \${amount}\`);
      
      try {
        // Try to input large amount in any amount field
        const amountField = await page.locator('input[type="number"], input[type="text"], [id*="amount"], [class*="amount"], [placeholder*="amount"]').first();
        if (await amountField.isVisible()) {
          await amountField.fill(amount);
          
          // Try to send the transaction
          const sendButton = await page.locator('button:visible:has-text("Send"), button:visible:has-text("Transfer"), button:visible:has-text("Submit")').first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            
            // Take a screenshot to document behavior
            await page.screenshot({ path: \`test-results/large-amount-test-\${Date.now()}.png\` });
            
            // Check for any error messages or UI behavior changes
            const errorElement = await page.locator('.error, .alert, [role="alert"]').first();
            if (await errorElement.isVisible()) {
              console.log(\`Error displayed: \${await errorElement.textContent()}\`);
            }
          }
        }
      } catch (e) {
        console.log(\`Error testing large amount: \${e.message}\`);
      }
      
      // Reset the page state if needed
      await page.reload();
    }
  });
`
    fuzzContent = fuzzContent.replace(/\}\);(\s*)$/, `${largeAmountsInjection}});$1`)
  }

  // Add eth_sign phishing vector tests
  if (type === 'sign' || type === 'connect') {
    const ethSignPhishingInjection =
      lang === 'ts'
        ? `  // Fuzz Testing: eth_sign Phishing Vectors
  test('should detect potential eth_sign phishing vectors', async () => {
    for (const phishingPayload of ${JSON.stringify(fuzzPayloads.ethSignPhishing)}) {
      console.log(\`Testing eth_sign phishing payload: \${phishingPayload}\`);
      
      try {
        // Mock the ethereum provider to test signing behavior with phishing vectors
        await page.evaluate((payload) => {
          if (window.ethereum) {
            // Store original functions
            const originalRequest = window.ethereum.request;
            const originalSendAsync = window.ethereum.sendAsync;
            
            // Mock request method
            window.ethereum.request = async function(args) {
              if (args.method === 'personal_sign' || args.method === 'eth_sign') {
                console.log('Intercepted signing request with potential phishing payload');
                // Replace message with phishing payload or append to it
                if (Array.isArray(args.params) && args.params.length > 0) {
                  // For personal_sign, the message is usually the second param (after address)
                  const messageIndex = args.method === 'personal_sign' ? 0 : 1;
                  if (typeof args.params[messageIndex] === 'string') {
                    args.params[messageIndex] = payload;
                  }
                }
              }
              return originalRequest.call(this, args);
            };
            
            // Mock sendAsync for older providers
            if (originalSendAsync) {
              window.ethereum.sendAsync = function(payload, callback) {
                if (payload.method === 'personal_sign' || payload.method === 'eth_sign') {
                  console.log('Intercepted sendAsync signing request');
                  if (Array.isArray(payload.params) && payload.params.length > 0) {
                    const messageIndex = payload.method === 'personal_sign' ? 0 : 1;
                    if (typeof payload.params[messageIndex] === 'string') {
                      payload.params[messageIndex] = phishingPayload;
                    }
                  }
                }
                return originalSendAsync.call(this, payload, callback);
              };
            }
          }
        }, phishingPayload);
        
        // Find and click any "Sign" or similar buttons
        const signButtons = await page.locator('button:has-text("Sign"), button:has-text("Approve"), button:has-text("Confirm")').all();
        for (let i = 0; i < signButtons.length; i++) {
          await signButtons[i].click().catch(() => console.log('Sign button click failed, continuing...'));
          await page.screenshot({ path: \`test-results/eth-sign-phishing-test-\${i}-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing eth_sign phishing vector: \${e.message}\`);
      }
      
      // Reset the page state
      await page.reload();
    }
  });
`
        : `  // Fuzz Testing: eth_sign Phishing Vectors
  test('should detect potential eth_sign phishing vectors', async () => {
    for (const phishingPayload of ${JSON.stringify(fuzzPayloads.ethSignPhishing)}) {
      console.log(\`Testing eth_sign phishing payload: \${phishingPayload}\`);
      
      try {
        // Mock the ethereum provider to test signing behavior with phishing vectors
        await page.evaluate((payload) => {
          if (window.ethereum) {
            // Store original functions
            const originalRequest = window.ethereum.request;
            const originalSendAsync = window.ethereum.sendAsync;
            
            // Mock request method
            window.ethereum.request = async function(args) {
              if (args.method === 'personal_sign' || args.method === 'eth_sign') {
                console.log('Intercepted signing request with potential phishing payload');
                // Replace message with phishing payload or append to it
                if (Array.isArray(args.params) && args.params.length > 0) {
                  // For personal_sign, the message is usually the second param (after address)
                  const messageIndex = args.method === 'personal_sign' ? 0 : 1;
                  if (typeof args.params[messageIndex] === 'string') {
                    args.params[messageIndex] = payload;
                  }
                }
              }
              return originalRequest.call(this, args);
            };
            
            // Mock sendAsync for older providers
            if (originalSendAsync) {
              window.ethereum.sendAsync = function(payload, callback) {
                if (payload.method === 'personal_sign' || payload.method === 'eth_sign') {
                  console.log('Intercepted sendAsync signing request');
                  if (Array.isArray(payload.params) && payload.params.length > 0) {
                    const messageIndex = payload.method === 'personal_sign' ? 0 : 1;
                    if (typeof payload.params[messageIndex] === 'string') {
                      payload.params[messageIndex] = phishingPayload;
                    }
                  }
                }
                return originalSendAsync.call(this, payload, callback);
              };
            }
          }
        }, phishingPayload);
        
        // Find and click any "Sign" or similar buttons
        const signButtons = await page.locator('button:has-text("Sign"), button:has-text("Approve"), button:has-text("Confirm")').all();
        for (let i = 0; i < signButtons.length; i++) {
          await signButtons[i].click().catch(() => console.log('Sign button click failed, continuing...'));
          await page.screenshot({ path: \`test-results/eth-sign-phishing-test-\${i}-\${Date.now()}.png\` });
        }
      } catch (e) {
        console.log(\`Error testing eth_sign phishing vector: \${e.message}\`);
      }
      
      // Reset the page state
      await page.reload();
    }
  });
`
    fuzzContent = fuzzContent.replace(/\}\);(\s*)$/, `${ethSignPhishingInjection}});$1`)
  }

  return fuzzContent
}

// Function to load config from .web3fuzzforge.json file
function loadConfigFile() {
  const configPath = path.join(process.cwd(), '.web3fuzzforge.json')
  const defaultConfig = configValidator.generateDefaultConfig()

  try {
    const result = configValidator.loadAndValidateConfig(configPath)

    // File doesn't exist - this is normal, just return empty object
    if (!result.fileExists) {
      console.log(chalk.yellow(`Configuration file not found: ${configPath}`))
      console.log(chalk.blue('Using default configuration instead.'))
      console.log(chalk.yellow("Tip: Run 'web3fuzzforge init' to create a configuration file."))
      return defaultConfig
    }

    // JSON parsing error
    if (result.parseError) {
      console.error(chalk.red(`Error loading config file: ${result.errors[0]}`))
      console.log(chalk.blue('Using default configuration instead.'))
      console.log(chalk.yellow("Tip: Run 'web3fuzzforge init' to create a valid configuration file."))
      return defaultConfig
    }

    // Config exists but validation failed - merge valid properties with defaults
    if (!result.isValid) {
      console.error(chalk.red('Configuration file validation failed:'))
      result.errors.forEach(error => {
        console.error(chalk.yellow(`- ${error}`))
      })
      console.log(chalk.blue('Using fallback values for invalid properties.'))
      
      // Merge the partial config with defaults
      const mergedConfig = { ...defaultConfig, ...result.config }
      
      console.log(chalk.yellow("Tip: Run 'web3fuzzforge validate' to check your configuration."))
      return mergedConfig
    }

    console.log(chalk.blue(`Loaded configuration from ${configPath}`))
    return result.config
  } catch (error) {
    // Catch any unexpected errors
    console.error(chalk.red(`Unexpected error loading config: ${error.message}`))
    console.log(chalk.blue('Using default configuration instead.'))
    console.log(chalk.yellow("Tip: Run 'web3fuzzforge init' to create a valid configuration file."))
    return defaultConfig
  }
}

// Function to load preset config from src/presets directory
function loadPresetConfig(presetName) {
  // Map aliases to preset filenames
  const presetMap = {
    erc20: 'erc.json',
    erc721: 'erc.json',
    erc: 'erc.json',
    defi: 'defi.json',
    dao: 'dao.json',
    security: 'security.json',
  }
  const normalized = (presetName || '').toLowerCase()
  const presetFile = presetMap[normalized]
  if (!presetFile) {
    console.log(chalk.yellow(`Unknown preset: ${presetName}`))
    return {}
  }
  const presetPath = path.join(__dirname, 'presets', presetFile)
  try {
    if (fs.existsSync(presetPath)) {
      const content = fs.readFileSync(presetPath, 'utf8')
      return JSON.parse(content)
    } else {
      console.log(chalk.yellow(`Preset file not found: ${presetPath}`))
      return {}
    }
  } catch (e) {
    console.log(chalk.red(`Error loading preset config: ${e.message}`))
    return {}
  }
}

// Function to validate required options
function validateRequiredOptions(options, requiredOptions) {
  const missingOptions = []

  for (const option of requiredOptions) {
    if (!options[option] || options[option].trim() === '') {
      missingOptions.push(option)
    }
  }

  return missingOptions
}

// Display help for a specific command
function displayHelp(command) {
  console.log(chalk.yellow(`\nUsage examples for '${command}':\n`))

  if (command === 'generate') {
    console.log('  web3fuzzforge generate connect --out ./tests/connection.test.js')
    console.log(
      '  web3fuzzforge generate tx --provider metamask --out ./tests/transaction.test.js'
    )
    console.log('  web3fuzzforge generate sign --lang ts --out ./tests/sign.test.ts')
    console.log(
      '  web3fuzzforge generate connect --wallet walletconnect --out ./tests/walletconnect-connection.test.js'
    )
    console.log(
      '  web3fuzzforge generate connect --wallet coinbase --out ./tests/coinbase-connection.test.js'
    )
    console.log('  web3fuzzforge generate security --preset defi --out ./tests/security-test.js')
    console.log('\nWith fuzzing enabled (security testing):')
    console.log('  web3fuzzforge generate connect --out ./tests/connection-fuzz.test.js --fuzz')
    console.log(
      '  web3fuzzforge generate tx --provider metamask --out ./tests/transaction-fuzz.test.js --fuzz'
    )
    console.log('  web3fuzzforge generate sign --out ./tests/sign-fuzz.test.js --fuzz')
    console.log(
      '\nUse --provider or --wallet to specify a wallet provider (metamask, walletconnect, coinbase, rabby)'
    )
    console.log('Feature flag example: web3fuzzforge generate connect --provider walletconnect')
  } else if (command === 'init') {
    console.log('  web3fuzzforge init')
    console.log('  web3fuzzforge init --force')
    console.log('  web3fuzzforge init --interactive')
    console.log('\nThe init command creates a default .web3fuzzforge.json configuration file.')
    console.log('Use --force to overwrite an existing configuration file.')
    console.log('Use --interactive for a guided setup wizard that detects your project type.')
  } else if (command === 'ask') {
    console.log('  web3fuzzforge ask "Generate a test for MetaMask connection to a DEX"')
    console.log(
      '  web3fuzzforge ask "Create a WalletConnect transaction test for an NFT marketplace" --run-with tx'
    )
    console.log('\nThe ask command uses AI to generate a configuration based on your prompt.')
    console.log(
      'Use --run-with to immediately generate a test using the AI-created configuration.'
    )
  } else if (command === 'validate') {
    console.log('  web3fuzzforge validate')
    console.log('  web3fuzzforge validate --config ./custom-config.json')
    console.log('\nThe validate command checks your configuration file against the schema.')
    console.log('It also identifies any missing template files that might cause issues.')
    console.log('Use --config to specify a custom configuration file path.')
  } else {
    console.log(`  Unknown command: ${command}`)
  }

  console.log('\nFor more information, run: web3fuzzforge --help\n')
}

/**
 * Check if a template exists for the given wallet and template type,
 * and optionally generate a placeholder template if missing
 * @param {string} wallet - Wallet provider (e.g. metamask, walletconnect)
 * @param {string} templateType - Template type (e.g. connection, transaction)
 * @param {string} templateExt - Template extension (.tpl or .ts.tpl)
 * @param {boolean} generatePlaceholder - Whether to generate a placeholder template if missing
 * @returns {boolean|Object} - Boolean if just checking, or object with result info if generating
 */
function checkTemplateExistence(wallet, templateType, templateExt, generatePlaceholder = false) {
  // If just checking existence without generating placeholders, use a simpler return
  if (generatePlaceholder === false) {
    let templatePath
    
    if (templateType === 'security') {
      // Check for generic security template first
      const genericSecurityPath = path.join(
        __dirname, '..',
        'templates',
        'security',
        `security.${templateExt}`
      )

      if (fs.existsSync(genericSecurityPath)) {
        return true
      }
      
      // Fallback to provider-specific security template
      templatePath = path.join(
        __dirname, '..',
        'templates',
        'providers',
        wallet,
        `security.${templateExt}`
      )
    } else {
      templatePath = path.join(
        __dirname, '..',
        'templates',
        'providers',
        wallet,
        `${templateType}.${templateExt}`
      )
    }
    
    return fs.existsSync(templatePath)
  }
  
  // For generate placeholder case, use the full object return
  const result = {
    templatePath: '',
    exists: false,
    generated: false,
  }

  // Construct template path
  if (templateType === 'security') {
    // Check for generic security template first
    const genericSecurityPath = path.join(
      __dirname, '..',
      'templates',
      'security',
      `security.${templateExt}`
    )

    if (fs.existsSync(genericSecurityPath)) {
      result.templatePath = genericSecurityPath
      result.exists = true
      return result
    } else {
      // Fallback to provider-specific security template
      result.templatePath = path.join(
        __dirname, '..',
        'templates',
        'providers',
        wallet,
        `security.${templateExt}`
      )
    }
  } else {
    result.templatePath = path.join(
      __dirname, '..',
      'templates',
      'providers',
      wallet,
      `${templateType}.${templateExt}`
    )
  }

  // Check if template exists
  result.exists = fs.existsSync(result.templatePath)

  // Generate placeholder template if needed
  if (!result.exists && generatePlaceholder) {
    try {
      // Create directories if they don't exist
      fs.ensureDirSync(path.dirname(result.templatePath))

      // Find a suitable template to base the placeholder on
      let baseTemplate = ''
      let foundBase = false

      // First, try to find the same template type in a different wallet
      const validWallets = ['metamask', 'walletconnect', 'rabby', 'coinbase']
      for (const baseWallet of validWallets) {
        if (baseWallet === wallet) continue // Skip the current wallet

        const basePath =
          templateType === 'security'
            ? path.join(__dirname, '..', 'templates', 'security', `security${templateExt}`)
            : path.join(
              __dirname, '..',
              'templates',
              'providers',
              baseWallet,
                `${templateType}${templateExt}`
            )

        if (fs.existsSync(basePath)) {
          baseTemplate = fs.readFileSync(basePath, 'utf8')
          foundBase = true
          break
        }
      }

      // If no base template found, create a minimal placeholder
      if (!foundBase) {
        const isTs = templateExt.includes('.ts')
        baseTemplate = createMinimalPlaceholder(wallet, templateType, isTs)
      } else {
        // Modify the base template to be a placeholder
        baseTemplate =
          `// PLACEHOLDER TEMPLATE - TODO: Implement proper ${wallet} ${templateType} template\n` +
          '// This is an auto-generated placeholder based on another wallet template\n' +
          '// Please submit a PR with a proper implementation\n\n' +
          baseTemplate
      }

      // Write the placeholder template
      fs.writeFileSync(result.templatePath, baseTemplate)
      result.generated = true
      result.exists = true
    } catch (error) {
      console.error(chalk.red(`Error creating placeholder template: ${error.message}`))
    }
  }

  return result
}

/**
 * Create a minimal placeholder template for a wallet + testType combination
 * @param {string} wallet - Wallet provider
 * @param {string} templateType - Template type
 * @param {boolean} isTypeScript - Whether to generate TypeScript template
 * @returns {string} Template content
 */
function createMinimalPlaceholder(wallet, templateType, isTypeScript) {
  const jsOrTs = isTypeScript ? 'TypeScript' : 'JavaScript'
  const imports = isTypeScript
    ? "import { test, expect } from '@playwright/test';"
    : "const { test, expect } = require('@playwright/test');"

  return `// TODO: PLACEHOLDER TEMPLATE - Needs implementation
// ${wallet} ${templateType} test with ${jsOrTs}
${imports}

// Test configuration
// eslint-disable-next-line no-unused-vars
const WALLET_ADDRESS = '{{address}}';
// eslint-disable-next-line no-unused-vars
const WALLET_NAME = '{{wallet}}';
${templateType === 'transaction' ? "const RECIPIENT_ADDRESS = '{{recipient}}';\nconst TRANSACTION_AMOUNT = '{{amount}}';" : ''}
${templateType === 'security' ? '// Add security test specific configuration here' : ''}
// eslint-disable-next-line no-unused-vars
const NETWORK_NAME = '{{network}}';

/**
 * ${wallet} ${templateType} Test - PLACEHOLDER
 * 
 * This is an auto-generated placeholder template that needs implementation.
 * Please submit a PR with a proper implementation for this wallet and test type.
 */
test('${wallet} ${templateType} test - TODO implement', async ({ page }) => {
  console.log('TODO: This is a placeholder test for ${wallet} ${templateType} that needs implementation');
  
  // Navigate to the dApp
  await page.goto('{{dapp_url}}');
  
  // TODO: Implement the actual test steps for ${wallet} ${templateType}
  // This should include:
  ${templateType === 'connection' ? '// - Wallet connection flow\n  // - Verifying connection status' : ''}
  ${templateType === 'transaction' ? '// - Wallet connection\n  // - Transaction creation and submission\n  // - Transaction confirmation' : ''}
  ${templateType === 'sign' ? '// - Wallet connection\n  // - Message signing\n  // - Signature verification' : ''}
  ${templateType === 'error' ? '// - Error handling scenarios\n  // - UI feedback on errors' : ''}
  ${templateType === 'security' ? '// - Security vulnerability testing\n  // - Attack vector simulation' : ''}
  
  // Placeholder assertion
  expect(true).toBeTruthy();
});
`
}

// Validate template type
function validateTemplateType(type) {
  return ['connect', 'tx', 'sign', 'error', 'security'].includes(type)
}

// Validate language option
function validateLanguage(lang) {
  const validLangs = ['js', 'ts']
  if (!validLangs.includes(lang)) {
    console.error(chalk.red(`Error: Invalid language '${lang}'`))
    console.log(chalk.yellow(`Supported languages: ${validLangs.join(', ')}`))
    return false
  }
  return true
}

// Validate provider option
function validateProvider(provider) {
  const validProviders = ['metamask', 'walletconnect', 'rabby', 'coinbase', 'phantom'] // Added phantom wallet
  if (!validProviders.includes(provider)) {
    console.error(chalk.red(`Error: Invalid provider '${provider}'`))
    console.log(chalk.yellow(`Supported providers: ${validProviders.join(', ')}`))
    console.log(chalk.yellow('Default provider: metamask'))
    return false
  }
  return true
}

// Default placeholder values
const defaultValues = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  wallet: 'Test Wallet',
  recipient: '0xabcdef1234567890abcdef1234567890abcdef12',
  amount: '0.1',
  network: 'Ethereum',
  chain_id: '0x1',
  dapp_url: 'about:blank',
  connect_button_selector: '#connect-button',
  wallet_info_selector: '#wallet-info',
  wallet_address_selector: '.wallet-address',
  recipient_field_selector: '#recipient',
  amount_field_selector: '#amount',
  send_button_selector: '#send-button',
  tx_confirmation_selector: '#tx-confirmation',
  tx_hash_selector: '#tx-hash',
  sign_button_selector: '#sign-button',
  signature_confirmation_selector: '#signature-confirmation',
  signature_selector: '#signature',
  transaction_hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
}

// Map template type aliases to template filenames
const templateTypeMap = {
  connect: 'connection',
  tx: 'transaction',
  sign: 'sign',
  error: 'error',
  security: 'security',
}

// Utility: Prettify template string using Prettier, with config caching
let cachedPrettierConfig = null
async function prettifyTemplate(code, filePath) {
  if (!cachedPrettierConfig) {
    try {
      cachedPrettierConfig = await prettier.resolveConfig(filePath || process.cwd())
    } catch (e) {
      cachedPrettierConfig = {}
    }
  }
  const ext = path.extname(filePath || '').toLowerCase()
  let parser = 'babel'
  if (ext === '.ts') parser = 'typescript'
  else if (ext === '.json') parser = 'json'
  else if (ext === '.md') parser = 'markdown'
  try {
    return prettier.format(code, { ...cachedPrettierConfig, parser })
  } catch (e) {
    console.warn(chalk.yellow(`Warning: Prettier formatting failed: ${e.message}`))
    return code
  }
}

// Utility: Lint and fix file using ESLint (with --fix and --no-error-on-unmatched-pattern)
async function lintAndFixFile(filePath) {
  try {
    const eslint = new ESLint({
      fix: true,
      cwd: process.cwd(),
      errorOnUnmatchedPattern: false,
    })
    const results = await eslint.lintFiles([filePath])
    await ESLint.outputFixes(results)
    const formatter = await eslint.loadFormatter('stylish')
    const resultText = formatter.format(results)
    if (resultText.trim()) {
      console.log(resultText)
    }
    const hasErrors = results.some(r => r.errorCount > 0)
    if (hasErrors) {
      console.warn(chalk.yellow('ESLint found errors in the generated file.'))
    }
  } catch (e) {
    console.warn(chalk.yellow(`Warning: ESLint failed: ${e.message}`))
  }
}

// Add this helper function before the 'ask' command definition

/**
 * Run a generate command with the specified type and options
 * @param {string} type - Test type to generate
 * @param {Object} config - Configuration options to use for generation
 * @returns {Promise<void>}
 */
async function runGenerateCommand(type, config) {
  try {
    // Default output file based on test type
    const outputFile = config.out || `./tests/${type}-generated.${config.lang || 'js'}`

    console.log(chalk.blue(`Generating ${type} test with configuration...`))

    // Build spawn arguments for the generate command
    const args = ['generate', type]

    // Add options as arguments
    for (const [key, value] of Object.entries(config)) {
      if (key !== 'out') {
        // Handle output file separately
        args.push(`--${key}`, value.toString())
      }
    }

    // Add output file
    args.push('--out', outputFile)

    console.log(chalk.blue(`Running command: web3fuzzforge ${args.join(' ')}`))

    // Use spawnSync to run the command
    const result = spawnSync(process.execPath, [process.argv[1], ...args], {
      stdio: 'inherit',
      encoding: 'utf-8',
    })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      throw new Error(`Command failed with exit code ${result.status}`)
    }

    console.log(chalk.green(`Test generated successfully at ${outputFile}`))
    return { success: true, outputFile }
  } catch (error) {
    console.error(chalk.red(`Error running generate command: ${error.message}`))
    return { success: false, error }
  }
}

/**
 * Run the init command to create a default configuration file
 */
async function runInitCommand(options) {
  console.log(chalk.blue('Initializing Web3FuzzForge configuration...'))

  const configPath = path.join(process.cwd(), '.web3fuzzforge.json')

  // Check if the file already exists
  if (fs.existsSync(configPath) && !options.force) {
    console.log(chalk.yellow(`Configuration file already exists at: ${configPath}`))
    console.log(chalk.yellow('Use --force to overwrite the existing file.'))
    return
  }

  // If interactive mode is enabled, run the interactive setup
  if (options.interactive) {
    await runInteractiveSetup(configPath)
    return
  }

  // Create the default configuration file
  const result = configValidator.createDefaultConfig(configPath)

  if (result.success) {
    console.log(chalk.green(result.message))
    console.log(chalk.blue('You can customize this file for your specific testing needs.'))
  } else {
    console.error(chalk.red(result.message))
  }
}

/**
 * Run the interactive setup wizard
 * @param {string} configPath - Path to save the configuration file
 * @returns {Promise<void>}
 */
async function runInteractiveSetup(configPath) {
  // We need to import inquirer dynamically since it's not loaded at the top
  try {
    // Check if inquirer is installed
    try {
      require.resolve('inquirer')
    } catch (e) {
      console.log(chalk.yellow('Installing inquirer package for interactive mode...'))
      
      // Use execSync to install inquirer
      const { execSync } = require('child_process')
      execSync('npm install --no-save inquirer@^8.0.0', { stdio: 'inherit' })
      
      console.log(chalk.green('✓ Inquirer installed successfully'))
    }
    
    const inquirer = require('inquirer')
    
    // Detect project type
    const projectType = await detectProjectType()
    
    console.log(chalk.blue('\nConfiguring Web3FuzzForge...'))
    
    // Default configuration from validator
    const defaultConfig = configValidator.generateDefaultConfig()
    
    // Run the interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'wallet',
        message: 'Select default wallet to test:',
        default: defaultConfig.wallet,
        choices: [
          { name: 'MetaMask', value: 'metamask' },
          { name: 'Coinbase Wallet', value: 'coinbase' },
          { name: 'WalletConnect', value: 'walletconnect' },
          { name: 'Phantom', value: 'phantom' },
          { name: 'Rabby', value: 'rabby' }
        ]
      },
      {
        type: 'input',
        name: 'dapp_url',
        message: 'Enter the URL of your dApp:',
        default: defaultConfig.dapp_url,
        validate: input => input.startsWith('http') ? true : 'Please enter a valid URL starting with http/https'
      },
      {
        type: 'input',
        name: 'connect_button_selector',
        message: 'Enter CSS selector for your wallet connect button:',
        default: defaultConfig.connect_button_selector,
        validate: input => input.length > 0 ? true : 'Selector cannot be empty'
      },
      {
        type: 'list',
        name: 'lang',
        message: 'Select your preferred language:',
        default: defaultConfig.lang,
        choices: [
          { name: 'JavaScript', value: 'js' },
          { name: 'TypeScript', value: 'ts' }
        ]
      },
      {
        type: 'input',
        name: 'out',
        message: 'Where should generated tests be saved?',
        default: defaultConfig.out
      },
      {
        type: 'confirm',
        name: 'lint',
        message: 'Enable automatic linting of generated tests?',
        default: defaultConfig.lint
      }
    ])

    // Create configuration with user answers
    const config = {
      ...answers,
      // Add project-specific settings based on detected project type
      project_type: projectType
    }

    // Write the configuration file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
    
    console.log(chalk.green(`\n✓ Configuration created successfully at: ${configPath}`))
    console.log(chalk.blue('You can further customize this file manually for specific testing needs.'))
    
    // Validate the created configuration
    const { isValid, errors } = configValidator.validateConfig(config)
    
    if (!isValid) {
      console.log(chalk.yellow('\nWarning: Some configuration values may need adjustment:'))
      errors.forEach(error => console.log(chalk.yellow(`- ${error}`)))
    }
    
  } catch (error) {
    console.error(chalk.red(`Error during interactive setup: ${error.message}`))
    console.log(chalk.yellow('Falling back to default configuration...'))
    
    // Fallback to non-interactive mode
    const result = configValidator.createDefaultConfig(configPath)
    
    if (result.success) {
      console.log(chalk.green(result.message))
    } else {
      console.error(chalk.red(result.message))
    }
  }
}

/**
 * Detect the project type to suggest appropriate templates
 * @returns {Promise<string>} Detected project type
 */
async function detectProjectType() {
  console.log(chalk.blue('Detecting project type...'))
  
  try {
    const cwd = process.cwd()
    
    // Check for package.json to determine project type
    const packageJsonPath = path.join(cwd, 'package.json')
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      // Look for common dependencies to identify project type
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      if (deps.react && deps['web3.js']) {
        console.log(chalk.green('✓ Detected: React dApp with web3.js'))
        return 'react-web3'
      } else if (deps.react && deps.ethers) {
        console.log(chalk.green('✓ Detected: React dApp with ethers.js'))
        return 'react-ethers'
      } else if (deps.vue && (deps.web3 || deps.ethers)) {
        console.log(chalk.green('✓ Detected: Vue dApp'))
        return 'vue-web3'
      } else if (deps.hardhat) {
        console.log(chalk.green('✓ Detected: Hardhat project'))
        return 'hardhat'
      } else if (deps.truffle) {
        console.log(chalk.green('✓ Detected: Truffle project'))
        return 'truffle'
      } else if (deps.express || deps.koa || deps.fastify) {
        console.log(chalk.green('✓ Detected: Node.js backend'))
        return 'node-backend'
      }
    }
    
    // Check for common files to determine project type
    if (fs.existsSync(path.join(cwd, 'truffle-config.js'))) {
      console.log(chalk.green('✓ Detected: Truffle project'))
      return 'truffle'
    } else if (fs.existsSync(path.join(cwd, 'hardhat.config.js')) || 
               fs.existsSync(path.join(cwd, 'hardhat.config.ts'))) {
      console.log(chalk.green('✓ Detected: Hardhat project'))
      return 'hardhat'
    } else if (fs.existsSync(path.join(cwd, 'foundry.toml'))) {
      console.log(chalk.green('✓ Detected: Foundry project'))
      return 'foundry'
    }
    
    // Default if no specific type detected
    console.log(chalk.yellow('No specific project type detected. Using generic configuration.'))
    return 'generic'
    
  } catch (error) {
    console.log(chalk.yellow('Error detecting project type. Using generic configuration.'))
    return 'generic'
  }
}

// Generate command
program
  .command('generate')
  .description('Generate a test template')
  .argument('<type>', 'Type of test to generate (connect, tx, sign, error, security)')
  .option('--preset <preset>', 'Use a predefined configuration preset (erc, defi, dao, security)')
  .option('--wallet <wallet>', 'Wallet to use (metamask [default], walletconnect, rabby, coinbase)')
  .option(
    '--provider <provider>',
    'Wallet provider (metamask, walletconnect, rabby, coinbase) - deprecated, use --wallet instead'
  )
  .option('--out <path>', 'Output file path')
  .option('--address <address>', 'Wallet address')
  .option('--wallet-name <n>', 'Wallet name')
  .option('--recipient <address>', 'Recipient address for transaction tests')
  .option('--amount <amount>', 'Transaction amount')
  .option('--network <network>', 'Network name')
  .option('--lang <language>', 'Language to use (js, ts)')
  .option(
    '--fuzz',
    'Inject security fuzzing test cases (XSS, large amounts, eth_sign phishing)',
    false
  )
  .option('--lint', 'Lint and format the generated template with ESLint and Prettier', false)
  .action(async (type, options) => {
    try {
      // Run environment check first
      await errorHandler.checkEnvironment()
      
      // Original command code
      console.log(chalk.blue(`Generating ${type} template...`))

      // Add alias mapping for template types
      const templateTypeMap = {
        connection: 'connect',
        transaction: 'tx',
        signing: 'sign',
        signature: 'sign',
        security: 'security',
        vuln: 'security',
        vulnerability: 'security',
      }

      // Look up presets by name or alias
      const presetMap = {
        erc: 'erc20-token',
        erc20: 'erc20-token',
        erc721: 'erc721-nft',
        nft: 'erc721-nft',
        defi: 'defi-swap',
        swap: 'defi-swap',
        dao: 'dao-voting',
        voting: 'dao-voting',
        security: 'security-full',
        full: 'security-full',
      }

      // Validate template type
      const validTypes = ['connect', 'tx', 'sign', 'security', 'error', ...Object.keys(templateTypeMap)]
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid template type: ${type}. Valid types are: ${validTypes.join(', ')}`)
      }

      // Load preset config if specified
      let presetConfig = {}
      if (options.preset) {
        const presetName = presetMap[options.preset] || options.preset
        const presetPath = path.join(__dirname, 'presets', `${presetName}.json`)

        try {
          if (fs.existsSync(presetPath)) {
            presetConfig = JSON.parse(fs.readFileSync(presetPath, 'utf8'))
            console.log(chalk.blue(`Loaded preset: ${options.preset}`))
          } else {
            console.error(
              chalk.yellow(`Warning: Preset "${options.preset}" not found, using default settings`)
            )
          }
        } catch (presetError) {
          console.error(
            chalk.yellow(
              `Warning: Error loading preset "${options.preset}": ${presetError.message}`
            )
          )
        }
      }

      // Validate provider - but don't override with default yet
      const providerToValidate = options.provider || options.wallet || presetConfig.provider || presetConfig.wallet
      
      function validateProvider(provider) {
        const validProviders = ['metamask', 'walletconnect', 'coinbase', 'phantom', 'rabby']
        return validProviders.includes(provider)
      }
      
      if (providerToValidate && !validateProvider(providerToValidate)) {
        console.log(
          chalk.yellow(
            `Warning: Invalid provider "${providerToValidate}". Valid providers are: metamask, walletconnect, coinbase, phantom, rabby`
          )
        )
      }

      // Validate wallet - same as provider validation but for the wallet option
      const walletToValidate = options.wallet || presetConfig.wallet || 'metamask'
      if (walletToValidate && !validateProvider(walletToValidate)) {
        console.log(chalk.yellow('Using default wallet: metamask'))
        options.wallet = 'metamask'
      }

      // Validate output path
      if (!options.out && !presetConfig.out) {
        throw new Error('Output file path is required. Please specify using --out option.')
      }

      // Load configuration from .web3fuzzforge.json if it exists
      const configDefaults = loadConfigFile()

      // Use our new error handling system
      errorHandler.handleError(error, 'Generate command', true)
    } catch (error) {
      // Use our new error handling system
      errorHandler.handleError(error, 'Generate command', true)
    }
  })

// Run command
program
  .command('run')
  .description('Run Playwright tests with configuration')
  .option('--headed', 'Run tests in headed mode to watch browser interactions', false)
  .option('--debug', 'Run tests in debug mode', false)
  .option('--project <project>', 'Specify Playwright project to run')
  .option('--grep <pattern>', 'Only run tests matching this pattern')
  .option('--config <path>', 'Path to playwright config file', './playwright.config.js')
  .option(
    '--report', 'Generate HTML report in /reports/index.html and open it after execution',
    false
  )
  .option('--target-url <url>', 'Specify the target URL for testing against a real dApp')
  .option(
    '--mock-mode',
    'Run tests against the built-in mock dApp (starts the mock server automatically)',
    false
  )
  .action(async options => {
    try {
      // Run environment check first
      await errorHandler.checkEnvironment()
      
      console.log(chalk.blue('Preparing to run Playwright tests...'))

      // Load configuration from file
      const userConfig = loadConfigFile()

      // Set environment variables based on config and command line
      if (options.target_url) {
        process.env.TARGET_URL = options.target_url
      } else if (userConfig && userConfig.dapp_url) {
        process.env.TARGET_URL = userConfig.dapp_url
      }

      // Enable mock mode if requested
      if (options.mock_mode) {
        console.log(chalk.blue('Starting mock dApp server...'))
        process.env.MOCK_MODE = 'true'

        // Start the mock server (in a separate process)
        const mockServerProcess = spawn(process.execPath, ['./mocked-sample-app/src/server.js'], {
          detached: true,
          stdio: 'ignore',
        })

        // Don't wait for the child process - let it run independently
        mockServerProcess.unref()

        // Wait for the server to start
        console.log(chalk.blue('Waiting for mock server to start...'))
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Construct the Playwright command
      const playwrightArgs = ['playwright', 'test']

      // Add options
      if (options.project) {
        playwrightArgs.push('--project', options.project)
      }

      if (options.grep) {
        playwrightArgs.push('--grep', options.grep)
      }

      if (options.headed) {
        playwrightArgs.push('--headed')
      }

      if (options.debug) {
        playwrightArgs.push('--debug')
      }

      if (options.config) {
        playwrightArgs.push('--config', options.config)
      }

      // Run Playwright tests
      console.log(chalk.blue(`Running Playwright with command: npx ${playwrightArgs.join(' ')}`))

      const playwrightProcess = spawn('npx', playwrightArgs, {
        stdio: 'inherit',
        shell: true,
      })

      return new Promise((resolve, reject) => {
        playwrightProcess.on('close', code => {
          if (code === 0) {
            console.log(chalk.green('\n✓ Tests completed successfully!'))

            // Generate and show report if requested
            if (options.report) {
              console.log(chalk.blue('Generating HTML report...'))
              try {
                // Ensure the reports directory exists
                if (!fs.existsSync('./reports')) {
                  fs.mkdirSync('./reports', { recursive: true })
                }

                // Copy the latest test results to the reports directory
                const testResultsDir = path.join(process.cwd(), 'test-results')
                const reportsDir = path.join(process.cwd(), 'reports')

                if (fs.existsSync(testResultsDir)) {
                  fs.copySync(testResultsDir, path.join(reportsDir, 'latest-results'))
                }

                // Create a simple HTML report
                const reportPath = path.join(reportsDir, 'index.html')
                const reportContent = generateSimpleReport()
                fs.writeFileSync(reportPath, reportContent)

                console.log(chalk.green(`✓ Report generated at: ${reportPath}`))

                // Try to open the report in the default browser
                try {
                  const openCommand =
                    process.platform === 'win32'
                      ? 'start'
                      : process.platform === 'darwin'
                        ? 'open'
                        : 'xdg-open'
                  exec(`${openCommand} ${reportPath}`)
                  console.log(chalk.blue('Opening report in your browser...'))
                } catch (openError) {
                  console.log(
                    chalk.yellow(`Could not open report automatically: ${openError.message}`)
                  )
                  console.log(chalk.blue(`You can view the report at: ${reportPath}`))
                }
              } catch (reportError) {
                console.error(
                  chalk.yellow(`Warning: Failed to generate report: ${reportError.message}`)
                )
              }
            }

            resolve()
          } else {
            const error = new Error(`Tests failed with exit code ${code}`)
            errorHandler.handleError(error, 'Playwright test execution', false)
            resolve() // Still resolve to avoid hanging
          }
        })

        playwrightProcess.on('error', err => {
          errorHandler.handleError(err, 'Playwright process', false)
          resolve() // Still resolve to avoid hanging
        })
      })
    } catch (error) {
      errorHandler.handleError(error, 'Run command', true)
    }
  })
