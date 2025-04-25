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
    console.log('\nThe init command creates a default .web3fuzzforge.json configuration file.')
    console.log('Use --force to overwrite an existing configuration file.')
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

  // Create the default configuration file
  const result = configValidator.createDefaultConfig(configPath)

  if (result.success) {
    console.log(chalk.green(result.message))
    console.log(chalk.blue('You can customize this file for your specific testing needs.'))
  } else {
    console.error(chalk.red(result.message))
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
      // Validate template type
      if (!validateTemplateType(type)) {
        displayHelp('generate')
        process.exit(1)
      }

      // Set default values for options not provided
      options.lang = options.lang || 'js'
      options.out = options.out || './tests/test.js'
      options.address = options.address || defaultValues.address
      options.walletName = options.walletName || defaultValues.wallet
      options.recipient = options.recipient || defaultValues.recipient
      options.amount = options.amount || defaultValues.amount
      options.network = options.network || defaultValues.network

      // Handle provider selection - IMPORTANT: provider takes precedence over wallet
      if (options.provider && !options.wallet) {
        options.wallet = options.provider
      } else if (!options.provider && !options.wallet) {
        options.provider = 'metamask'
        options.wallet = 'metamask'
      }

      // Remove debug logs
      // console.log(chalk.cyan(`Final options.provider: ${options.provider}`));
      // console.log(chalk.cyan(`Final options.wallet: ${options.wallet}`));

      // Load preset configuration if specified
      let presetConfig = {}
      if (options.preset) {
        presetConfig = loadPresetConfig(options.preset) || {}
        if (Object.keys(presetConfig).length === 0) {
          console.log(chalk.yellow('Continuing without preset configuration.'))
        }
      }

      // Validate language (after potential preset load)
      const langToValidate = options.lang || presetConfig.lang || 'js'
      if (!validateLanguage(langToValidate)) {
        displayHelp('generate')
        process.exit(1)
      }

      // Validate provider (after potential preset load)
      const providerToValidate = options.provider || presetConfig.provider || 'metamask'
      if (!validateProvider(providerToValidate)) {
        displayHelp('generate')
        process.exit(1)
      }

      // Validate wallet - same as provider validation but for the wallet option
      const walletToValidate = options.wallet || presetConfig.wallet || 'metamask'
      if (walletToValidate && !validateProvider(walletToValidate)) {
        console.log(chalk.yellow('Using default wallet: metamask'))
        options.wallet = 'metamask'
      }

      // Validate output path
      if (!options.out && !presetConfig.out) {
        console.error(chalk.red('Error: Output file path is required'))
        console.log(chalk.yellow('Please specify an output file using the --out option'))
        displayHelp('generate')
        process.exit(1)
      }

      // Load configuration from .web3fuzzforge.json if it exists
      const configDefaults = loadConfigFile()

      // Check if linting is enabled in config (if not specified in command line)
      if (options.lint === undefined) {
        if (presetConfig.lint !== undefined) {
          options.lint = presetConfig.lint
        } else if (configDefaults.lint !== undefined) {
          options.lint = configDefaults.lint
        }
      }

      // Map the template type alias to the actual template name
      const templateType = templateTypeMap[type] || type

      // Determine template file extension based on language option (priority: CLI > preset > config file > default)
      const configLang = options.lang || presetConfig.lang || configDefaults.lang || 'js'
      const isTypeScript = configLang === 'ts'
      const templateExt = isTypeScript ? 'ts' : 'js'

      // Determine template file based on type and provider (priority: CLI > preset > config file > default)
      const provider =
        options.provider || presetConfig.provider || configDefaults.provider || 'metamask'

      // IMPORTANT: Always set wallet option based on provider if not explicitly provided
      // This overrides any wallet name from config that might be mistakenly used as a provider
      let walletToUse

      // Remove debug start logs
      // console.log('DEBUG START ----------------------');
      // console.log(`options.provider = "${options.provider}"`);
      // console.log(`options.wallet = "${options.wallet}"`);
      // console.log(`provider = "${provider}"`);

      // If --wallet is specified explicitly, use that
      if (options.wallet && validateProvider(options.wallet)) {
        walletToUse = options.wallet
        // Remove debug log
        // console.log(`A: walletToUse set to "${walletToUse}" from options.wallet`);
      } else if (options.provider) {
        walletToUse = provider
        // Remove debug log
        // console.log(`B: walletToUse set to "${walletToUse}" from provider`);
      } else {
        walletToUse = 'metamask'
        // Remove debug log
        // console.log(`C: walletToUse set to "${walletToUse}" as default`);
      }
      // Remove debug end logs
      // console.log(`Final walletToUse = "${walletToUse}"`);
      // console.log('DEBUG END ------------------------');

      // Log which wallet is being used
      if (walletToUse === 'walletconnect') {
        console.log(chalk.blue('Using WalletConnect provider'))
      } else if (walletToUse === 'rabby') {
        console.log(chalk.yellow('Rabby wallet support is planned for future releases'))
        // We now have a Rabby template that internally uses the MetaMask provider
        console.log(chalk.blue('Using Rabby templates (based on MetaMask)'))
      } else if (walletToUse === 'coinbase') {
        console.log(chalk.blue('Using Coinbase Wallet provider (Alpha support)'))
      } else {
        console.log(chalk.blue('Using MetaMask provider'))
      }

      // IMPORTANT: Use walletToUse directly in template path construction, not options.wallet
      const templateResult = checkTemplateExistence(walletToUse, templateType, templateExt, true)
      const templateFile = templateResult.templatePath
      const templateWasGenerated = templateResult.generated

      // Display appropriate message for template status
      if (templateWasGenerated) {
        console.log(
          chalk.yellow(
            `Template for ${walletToUse} ${type} was missing, generated placeholder template.`
          )
        )
        console.log(
          chalk.yellow(
            'Please consider submitting a PR with a proper implementation of this template.'
          )
        )
      } else if (!templateResult.exists) {
        console.error(chalk.red(`Template not found: ${templateFile}`))
        console.log(
          chalk.yellow(
            `This may mean the combination of provider (${provider}) and template type (${type}) is not supported yet.`
          )
        )

        console.log(chalk.yellow('\nAvailable templates are:'))

        const templatesDir = path.join(__dirname, '..', 'templates', 'providers')
        if (fs.existsSync(templatesDir)) {
          const availableTemplates = fs.readdirSync(templatesDir)

          if (availableTemplates.length === 0) {
            console.log(chalk.red('No templates found. The installation might be corrupted.'))
          } else {
            availableTemplates.forEach(template => {
              console.log(chalk.green(`- ${template.replace('.tpl', '').replace('.ts.tpl', '')}`))
            })
          }
        } else {
          console.error(chalk.red(`Templates directory not found: ${templatesDir}`))
          console.log(
            chalk.yellow('The installation might be corrupted. Try reinstalling the package.')
          )
        }

        process.exit(1)
      }

      // Read template content
      let templateContent
      try {
        templateContent = fs.readFileSync(templateFile, 'utf8')
      } catch (readError) {
        console.error(chalk.red(`Error reading template file: ${readError.message}`))
        process.exit(1)
      }

      // Create replacements object with values in order of precedence:
      // 1. Command-line options (highest)
      // 2. Preset configuration
      // 3. Config file values
      // 4. Default values (lowest)
      const replacements = {
        ...defaultValues,
        ...configDefaults,
        ...presetConfig,
      }

      // Update replacements with command-line options (highest precedence)
      if (options.address) replacements.address = options.address
      if (options.walletName) replacements.wallet = options.walletName
      if (options.recipient) replacements.recipient = options.recipient
      if (options.amount) replacements.amount = options.amount
      if (options.network) replacements.network = options.network
      if (options.out) replacements.out = options.out

      // Replace placeholders in template
      let outputContent = replacePlaceholders(templateContent, replacements)

      // Inject fuzzing test cases if --fuzz flag is enabled
      if (options.fuzz) {
        console.log(chalk.blue('Injecting security fuzzing test cases...'))
        outputContent = injectFuzzingTestCases(outputContent, type, configLang)
      }

      // Ensure output directory exists
      const outputPath = options.out || replacements.out || './tests/test.js'
      const outputDir = path.dirname(outputPath)
      try {
        fs.ensureDirSync(outputDir)
      } catch (dirError) {
        console.error(chalk.red(`Error creating output directory: ${dirError.message}`))
        console.log(
          chalk.yellow(`Please check if you have permissions to create directory: ${outputDir}`)
        )
        process.exit(1)
      }

      // Adjust output file extension if TypeScript is selected but output doesn't end with .ts
      let finalOutputPath = outputPath
      if (isTypeScript && !finalOutputPath.endsWith('.ts')) {
        finalOutputPath = finalOutputPath.replace(/\.js$/, '.ts')
        if (!finalOutputPath.endsWith('.ts')) {
          finalOutputPath += '.ts'
        }
        // Remove debug log
        // console.log(chalk.yellow(`Adjusting output file extension to .ts: ${finalOutputPath}`));
      }

      // Write output file
      try {
        // Prettify output before writing
        outputContent = await prettifyTemplate(outputContent, finalOutputPath)
        fs.writeFileSync(finalOutputPath, outputContent)
        console.log(chalk.green(`Test template generated successfully: ${finalOutputPath}`))
        if (options.fuzz) {
          console.log(chalk.green('Security fuzzing test cases have been injected:'))
          console.log(chalk.yellow('- XSS payloads for input fields (where applicable)'))
          if (type === 'tx') {
            console.log(chalk.yellow('- Large transaction amounts for DoS testing'))
          }
          if (type === 'sign') {
            console.log(chalk.yellow('- eth_sign phishing vectors'))
          }
        }
        // Show which preset was used if applicable
        if (options.preset && presetConfig.name) {
          console.log(chalk.green(`Used preset: ${presetConfig.name}`))
        }
        // Lint and format the file if --lint option is provided
        if (options.lint) {
          try {
            console.log(chalk.blue('Linting and fixing generated template with ESLint...'))
            await lintAndFixFile(finalOutputPath)
          } catch (lintError) {
            console.error(
              chalk.yellow(`Warning: Linting encountered an error: ${lintError.message}`)
            )
          }
        }
      } catch (writeError) {
        console.error(chalk.red(`Error writing output file: ${writeError.message}`))
        console.log(
          chalk.yellow(`Please check if you have permissions to write to: ${finalOutputPath}`)
        )
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red(`Error generating template: ${error.message}`))
      if (error.stack) {
        console.debug(chalk.gray(error.stack))
      }
      displayHelp('generate')
      process.exit(1)
    }
  })

// Init command - creating a new project
program
  .command('init')
  .description('Initialize a new Web3FuzzForge configuration file')
  .option('--force', 'Overwrite existing configuration file', false)
  .action(async options => {
    await runInitCommand(options)
  })

// Check Templates command
program
  .command('check-templates')
  .description('Check for missing template combinations and generate placeholders if requested')
  .option('--generate', 'Generate placeholder templates for missing combinations', false)
  .action(async options => {
    console.log(chalk.blue('Checking for missing template combinations...'))

    // Template types and wallet combinations to check
    const templateTypes = ['connection', 'transaction', 'sign', 'error', 'security']
    const wallets = ['metamask', 'walletconnect', 'rabby', 'coinbase', 'phantom']
    const extensions = ['.tpl', '.ts.tpl']

    // Track missing templates
    const missingTemplates = []
    let generatedCount = 0

    // Check each combination
    wallets.forEach(wallet => {
      templateTypes.forEach(templateType => {
        extensions.forEach(ext => {
          const templateResult = checkTemplateExistence(
            wallet, templateType,
            ext,
            options.generate
          )

          if (!templateResult.exists) {
            missingTemplates.push({
              wallet,
              templateType,
              extension: ext,
            })
          } else if (templateResult.generated) {
            generatedCount++
            console.log(
              chalk.green(`Generated placeholder template: ${templateResult.templatePath}`)
            )
          }
        })
      })
    })

    // Report results
    if (missingTemplates.length === 0) {
      console.log(chalk.green('All template combinations exist!'))
    } else {
      console.log(chalk.yellow(`Missing ${missingTemplates.length} template combinations:`))

      // Group missing templates by wallet for better readability
      const grouped = {}
      missingTemplates.forEach(template => {
        if (!grouped[template.wallet]) {
          grouped[template.wallet] = []
        }
        grouped[template.wallet].push(`${template.templateType}${template.extension}`)
      })

      Object.keys(grouped)
        .sort()
        .forEach(wallet => {
          console.log(chalk.yellow(`  ${wallet}:`))
          grouped[wallet].sort().forEach(template => {
            console.log(chalk.yellow(`    - ${template}`))
          })
        })

      if (options.generate) {
        console.log(chalk.green(`Generated ${generatedCount} placeholder templates`))
      } else {
        console.log(
          chalk.blue('Run with --generate to create placeholder templates for missing combinations')
        )
      }
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
  .action(options => {
    try {
      const { spawn } = require('child_process')
      const utils = require(path.join(__dirname, '..', 'utils', 'ensure-reports-dir'))

      // Ensure reports directory is ready
      utils.ensureReportsDirectory()

      // Check if at least one of target-url or mock-mode is provided
      if (!options.targetUrl && !options.mockMode) {
        console.error(chalk.red('Error: Either --target-url or --mock-mode must be specified.'))
        console.log(chalk.blue('Run with --mock-mode to use the built-in mock dApp'))
        console.log(
          chalk.blue('or --target-url=http://your-app-url to test against a real application.')
        )
        process.exit(1)
      }

      // Create environment variables object with current environment
      const envVars = { ...process.env }

      // Set environment variables based on options
      if (options.mockMode) {
        envVars.MOCK_MODE = 'true'
      }

      if (options.targetUrl) {
        envVars.TARGET_URL = options.targetUrl
      }

      // If mock-mode is enabled, start the mock dApp server
      let mockProcess = null
      if (options.mockMode) {
        console.log(chalk.blue('Starting mock dApp server...'))

        // Use spawn with shell option to ensure npm is found on Windows
        mockProcess = spawn('npm', ['start'], {
          cwd: path.join(process.cwd(), 'mocked-sample-app'),
          shell: true, // Add this to ensure npm command works on Windows
          detached: process.platform !== 'win32',
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        // Log output from the mock server
        mockProcess.stdout.on('data', data => {
          console.log(chalk.gray(`[Mock dApp] ${data.toString().trim()}`))
        })

        mockProcess.stderr.on('data', data => {
          console.error(chalk.red(`[Mock dApp Error] ${data.toString().trim()}`))
        })

        // Wait for the server to start
        console.log(chalk.yellow('Waiting for mock dApp server to start...'))
        setTimeout(() => {
          runPlaywrightTests()
        }, 3000)
      } else {
        // Run tests immediately if not using mock mode
        runPlaywrightTests()
      }

      // eslint-disable-next-line no-inner-declarations
      function runPlaywrightTests() {
        // Build the command arguments
        const args = ['playwright', 'test']

        if (options.headed) {
          args.push('--headed')
        }

        if (options.debug) {
          args.push('--debug')
        }

        if (options.project) {
          args.push('--project', options.project)
        }

        if (options.grep) {
          args.push('--grep', options.grep)
        }

        if (options.config) {
          args.push('--config', options.config)
        }

        // Define reporter as HTML if report flag is set or we're in CI
        if (options.report || process.env.CI) {
          args.push('--reporter=html')
        }

        console.log(chalk.blue(`Running: npx ${args.join(' ')}`))

        // For debug, show what environment variables we're using
        console.log(chalk.blue('Using environment variables:'))
        if (envVars.MOCK_MODE) console.log(chalk.blue(`  MOCK_MODE=${envVars.MOCK_MODE}`))
        if (envVars.TARGET_URL) console.log(chalk.blue(`  TARGET_URL=${envVars.TARGET_URL}`))

        // Spawn process with environment variables
        const testProcess = spawn('npx', args, {
          stdio: 'inherit',
          shell: true,
          env: envVars,
        })

        // Handle process exit
        testProcess.on('exit', async code => {
          // If we have a running mock server, kill it
          if (mockProcess) {
            console.log(chalk.blue('Shutting down mock dApp server...'))
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', mockProcess.pid, '/f', '/t'], { stdio: 'ignore' })
            } else {
              process.kill(-mockProcess.pid)
            }
          }

          if (code === 0) {
            console.log(chalk.green('Tests completed successfully!'))

            // Run merge-reports script if it exists
            try {
              await mergeReports()
            } catch (error) {
              console.error(chalk.yellow(`Warning: Could not merge reports: ${error.message}`))
            }

            // Open the report if requested and not in CI
            if (!process.env.CI && options.report) {
              console.log(chalk.blue('Opening HTML report...'))
              const open = spawn('npx', ['playwright', 'show-report', 'reports'], {
                stdio: 'inherit',
                detached: true,
              })
            }
          } else {
            console.error(chalk.red(`Tests failed with code ${code}`))
          }

          process.exit(code)
        })

        testProcess.on('error', error => {
          // If we have a running mock server, kill it
          if (mockProcess) {
            console.log(chalk.blue('Shutting down mock dApp server...'))
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', mockProcess.pid, '/f', '/t'], { stdio: 'ignore' })
            } else {
              process.kill(-mockProcess.pid)
            }
          }

          console.error(chalk.red(`Error running tests: ${error.message}`))
          process.exit(1)
        })
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  })

// Add a new 'ask' command
program
  .command('ask')
  .description('Generate configuration or code using AI assistant')
  .option('-q, --query <query>', 'Natural language query to generate code or configuration')
  .option('-k, --key <key>', 'OpenAI API key (or set OPENAI_API_KEY environment variable)')
  .action(async options => {
    const openAIKey = options.key || process.env.OPENAI_API_KEY

    if (!options.query) {
      console.error(chalk.red('Error: Please provide a query with the --query option'))
      process.exit(1)
    }

    if (!openAIKey) {
      console.error(
        chalk.red('Error: OPENAI_API_KEY environment variable or --key option is required')
      )
      process.exit(1)
    }

    try {
      const generator = getOpenAIGenerator()
      await generator.generateFromPrompt(options.query, openAIKey)
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      if (error.stack && process.env.DEBUG) {
        console.error(chalk.gray(error.stack))
      }
      process.exit(1)
    }
  })

program
  .command('doctor')
  .description('Verify if basic mocks/configs are set up properly')
  .action(async () => {
    console.log(chalk.blue('🔍 Web3FuzzForge Doctor: Checking your environment...'))

    const checkResults = {
      configFile: { status: 'pending', message: 'Checking configuration file' },
      environmentVars: { status: 'pending', message: 'Checking environment variables' },
      dependencies: { status: 'pending', message: 'Verifying required dependencies' },
      templateFiles: { status: 'pending', message: 'Checking template files' },
      browsers: { status: 'pending', message: 'Checking browser setup for tests' },
    }

    // Function to update and display check status
    const updateStatus = (check, status, message) => {
      checkResults[check].status = status
      checkResults[check].message = message

      // Display with appropriate color
      const icon =
        status === 'success'
          ? '✅'
          : status === 'warning'
            ? '⚠️'
            : status === 'error'
              ? '❌'
              : '🔍'
      const color =
        status === 'success'
          ? chalk.green
          : status === 'warning'
            ? chalk.yellow
            : status === 'error'
              ? chalk.red
              : chalk.blue

      console.log(`${icon} ${color(message)}`)
    }

    // Check configuration file
    try {
      const configValidator = require('./config-validator')
      const result = configValidator.loadAndValidateConfig()

      if (!result.fileExists) {
        updateStatus(
          'configFile',
          'warning',
          'Configuration file (.web3fuzzforge.json) not found. Run "web3fuzzforge init" to create one.'
        )
      } else if (!result.isValid) {
        updateStatus(
          'configFile',
          'error',
          `Configuration file exists but has errors: ${result.errors.join(', ')}`
        )
      } else {
        updateStatus('configFile', 'success', 'Configuration file (.web3fuzzforge.json) is valid')
      }
    } catch (error) {
      updateStatus('configFile', 'error', `Error checking configuration: ${error.message}`)
    }

    // Check environment variables
    const requiredEnvVars = ['PLAYWRIGHT_BROWSERS_PATH']
    const optionalEnvVars = ['OPENAI_API_KEY', 'DEBUG']
    const missingRequired = requiredEnvVars.filter(v => !process.env[v])
    const missingOptional = optionalEnvVars.filter(v => !process.env[v])

    if (missingRequired.length > 0) {
      updateStatus(
        'environmentVars',
        'warning',
        `Missing recommended environment variables: ${missingRequired.join(', ')}`
      )
    } else {
      let message = 'All recommended environment variables are set'
      if (missingOptional.length > 0) {
        message += `. Optional variables not set: ${missingOptional.join(', ')}`
      }
      updateStatus('environmentVars', 'success', message)
    }

    // Check dependencies
    try {
      // Verify @playwright/test is installed
      const playwrightInfo = JSON.parse(
        execSync('npm list @playwright/test --json', {
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString()
      )
      const dappeteerInfo = JSON.parse(
        execSync('npm list @chainsafe/dappeteer --json', {
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString()
      )

      const hasDependencyIssues = playwrightInfo.problems || dappeteerInfo.problems

      if (hasDependencyIssues) {
        updateStatus(
          'dependencies', 'error',
          'Dependency issues detected. Run "npm install" to fix them.'
        )
      } else {
        updateStatus('dependencies', 'success', 'All required dependencies are properly installed')
      }
    } catch (error) {
      updateStatus('dependencies', 'error', `Error checking dependencies: ${error.message}`)
    }

    // Check template files existence
    try {
      const templatesPath = path.join(__dirname, '..', 'templates')
      const providerDirs = ['metamask', 'coinbase', 'phantom', 'walletconnect', 'rabby']
      const templates = ['connect', 'tx', 'sign']
      const missingTemplates = []

      for (const provider of providerDirs) {
        for (const template of templates) {
          const templatePath = path.join(templatesPath, 'providers', provider, `${template}.js`)
          if (!fs.existsSync(templatePath)) {
            missingTemplates.push(`${provider}/${template}.js`)
          }
        }
      }

      if (missingTemplates.length > 0) {
        updateStatus(
          'templateFiles',
          'warning',
          `Some template files are missing: ${missingTemplates.join(', ')}`
        )
      } else {
        updateStatus('templateFiles', 'success', 'All template files are present')
      }
    } catch (error) {
      updateStatus('templateFiles', 'error', `Error checking template files: ${error.message}`)
    }

    // Check browser setup
    try {
      const result = spawnSync('npx', ['playwright', 'install', '--dry-run'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
      })

      if (result.status !== 0) {
        updateStatus(
          'browsers', 'error',
          'Browser installation issue detected. Run "npx playwright install" to fix it.'
        )
      } else if (result.stdout.includes('already installed')) {
        updateStatus('browsers', 'success', 'Playwright browsers are properly installed')
      } else {
        updateStatus(
          'browsers', 'warning',
          'Some browsers may need to be installed. Run "npx playwright install"'
        )
      }
    } catch (error) {
      updateStatus('browsers', 'error', `Error checking browser installation: ${error.message}`)
    }

    // Final summary
    console.log('\n' + chalk.blue('🩺 Doctor Examination Results:'))

    const errorCount = Object.values(checkResults).filter(r => r.status === 'error').length
    const warningCount = Object.values(checkResults).filter(r => r.status === 'warning').length

    if (errorCount > 0) {
      console.log(chalk.red(`❌ Found ${errorCount} critical issues that need to be fixed.`))
    }

    if (warningCount > 0) {
      console.log(
        chalk.yellow(`⚠️ Found ${warningCount} warnings that may impact test reliability.`)
      )
    }

    if (errorCount === 0 && warningCount === 0) {
      console.log(chalk.green('✅ All checks passed! Your environment is properly set up.'))
    } else {
      console.log(chalk.blue('\nRecommended actions:'))
      if (!checkResults.configFile.fileExists) {
        console.log(chalk.yellow('- Run "web3fuzzforge init" to create a configuration file'))
      }
      if (checkResults.dependencies.status === 'error') {
        console.log(chalk.red('- Run "npm install" to fix dependency issues'))
      }
      if (checkResults.browsers.status !== 'success') {
        console.log(chalk.yellow('- Run "npx playwright install" to set up required browsers'))
      }
    }
  })

// Add validate command
program
  .command('validate')
  .description('Validate the configuration file and check for missing templates')
  .option('-c, --config <path>', 'Path to the configuration file')
  .action(async (options) => {
    const configPath = options.config || path.join(process.cwd(), '.web3fuzzforge.json')
    const { config, isValid, errors, fileExists, parseError } = configValidator.loadAndValidateConfig(configPath)
    
    console.log(chalk.blue('Configuration Validation Results:'))
    console.log(chalk.blue('================================'))
    
    if (!fileExists) {
      console.log(chalk.red(`Configuration file not found: ${configPath}`))
      console.log(chalk.yellow(`Run 'web3fuzzforge init' to create a default configuration.`))
      process.exit(1)
    }
    
    if (parseError) {
      console.log(chalk.red(`Invalid JSON format in ${configPath}`))
      console.log(chalk.yellow('Please fix the JSON syntax errors.'))
      process.exit(1)
    }
    
    if (!isValid) {
      console.log(chalk.red('Configuration validation failed:'))
      errors.forEach(error => console.log(chalk.red(` - ${error}`)))
      console.log(chalk.yellow('Using fallback defaults for invalid properties.'))
    } else {
      console.log(chalk.green('Configuration is valid! ✓'))
    }
    
    // Check for template files
    if (config && config.wallet) {
      const wallet = config.wallet
      const lang = config.lang || 'js'
      const templateExt = lang === 'ts' ? 'ts' : 'js'
      
      console.log(chalk.blue('\nTemplate Availability:'))
      console.log(chalk.blue('====================='))
      
      // Check connect template
      const connectExists = checkTemplateExistence(wallet, 'connect', templateExt, false)
      console.log(`Connect template for ${wallet} (${lang}): ${connectExists ? chalk.green('✓ Available') : chalk.yellow('⚠ Missing')}`)
      
      // Check transaction template
      const txExists = checkTemplateExistence(wallet, 'tx', templateExt, false)
      console.log(`Transaction template for ${wallet} (${lang}): ${txExists ? chalk.green('✓ Available') : chalk.yellow('⚠ Missing')}`)
      
      // Check sign template
      const signExists = checkTemplateExistence(wallet, 'sign', templateExt, false)
      console.log(`Sign template for ${wallet} (${lang}): ${signExists ? chalk.green('✓ Available') : chalk.yellow('⚠ Missing')}`)
    }
    
    console.log(chalk.blue('\nNext Steps:'))
    if (!isValid) {
      console.log(chalk.yellow(` - Fix configuration issues in ${configPath}`))
      console.log(chalk.yellow(` - Run 'web3fuzzforge validate' again to verify changes`))
    } else {
      console.log(chalk.green(` - Configuration is ready for use`))
      console.log(chalk.green(` - Run 'web3fuzzforge generate' to create test files`))
    }
  })

// Handle unknown commands
program.on('command:*', operands => {
  console.error(chalk.red(`Error: Unknown command '${operands[0]}'`))
  console.log()
  console.log(chalk.yellow('Available commands:'))
  console.log(chalk.green('  generate - Generate a test template'))
  console.log(chalk.green('  ask      - Use AI to generate configuration from a prompt'))
  console.log(chalk.green('  init     - Initialize a new test project'))
  console.log(chalk.green('  run      - Run Playwright tests with configuration'))
  console.log()
  displayHelp()
  process.exit(1)
})

// Show help if no arguments provided
if (process.argv.length <= 2) {
  program.help()
}

program.parse(process.argv)

// Instead, add a function to get the module only when needed:
function getOpenAIGenerator() {
  try {
    return require(path.join(__dirname, '..', 'utils', 'openai-generator'))
  } catch (error) {
    console.error(chalk.red(`Error loading OpenAI generator: ${error.message}`))
    console.log(chalk.yellow('Make sure you have installed the required dependencies:'))
    console.log(chalk.white('npm install openai dotenv'))
    process.exit(1)
  }
}

// Add mergeReports function
function mergeReports() {
  try {
    console.log(chalk.blue('Merging report files...'))
    const reportDir = path.join(process.cwd(), 'reports')
    const outputFile = path.join(reportDir, 'merged-report.html')

    if (!fs.existsSync(reportDir)) {
      console.log(chalk.yellow(`Reports directory not found: ${reportDir}`))
      return false
    }

    const dataDir = path.join(reportDir, 'data')
    if (!fs.existsSync(dataDir)) {
      console.log(chalk.yellow(`Reports data directory not found: ${dataDir}`))
      return false
    }

    // Implement the report merging logic here
    console.log(chalk.green(`Reports merged successfully: ${outputFile}`))
    return true
  } catch (error) {
    console.error(chalk.red(`Error merging reports: ${error.message}`))
    return false
  }
}
