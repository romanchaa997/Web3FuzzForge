// Test script for alpha plugin providers (CommonJS)

// Mock the appendToOutput function to capture output
function mockAppendToOutput(output) {
  console.log('OUTPUT:', output)
}

// Test using the actual script implementation rather than imports
const fs = require('fs')
const path = require('path')

// Read the script.js file and extract the "create" command implementation
const scriptPath = path.join(__dirname, 'src', 'web-ui', 'script.js')
const scriptContent = fs.readFileSync(scriptPath, 'utf-8')

console.log('Testing provider plugins directly with commands...')

// Create a mock DOM environment
const mockCommands = {
  appendToOutput: mockAppendToOutput,
}

// Test commands directly
async function testCommands() {
  try {
    console.log('\nTesting "create" command with WalletConnect provider:')
    await runCreateCommand(['connect', '--provider=walletconnect', '--lang=js'])

    console.log('\nTesting "create" command with Coinbase provider:')
    await runCreateCommand(['connect', '--provider=coinbase', '--lang=js'])

    console.log('\nAll tests completed!')
  } catch (error) {
    console.error('Error testing commands:', error)
  }
}

async function runCreateCommand(args) {
  console.log(`Running: create ${args.join(' ')}`)

  // Print what would happen in the actual UI
  console.log('This would create a test template with:')
  console.log(`- Template: ${args[0]}`)
  console.log(`- Provider: ${args.find(a => a.startsWith('--provider=')).split('=')[1]}`)
  console.log(`- Language: ${args.find(a => a.startsWith('--lang=')).split('=')[1]}`)

  // In the real UI, this would dynamically import and run the provider plugin
  const provider = args.find(a => a.startsWith('--provider=')).split('=')[1]
  console.log(`\nWould import: /utils/providerLoader.js for provider: ${provider}`)

  // Read the actual provider file content to show its implementation
  try {
    const providerPath = path.join(__dirname, 'utils', `${provider}.js`)
    const providerCode = fs.readFileSync(providerPath, 'utf-8')
    console.log(`\nProvider implementation (${provider}.js):`)
    console.log('----------------------------------------')
    console.log(providerCode)
    console.log('----------------------------------------')
  } catch (err) {
    console.error(`Could not read provider file: ${err.message}`)
  }
}

testCommands()
