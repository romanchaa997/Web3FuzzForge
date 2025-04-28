# Web3FuzzForge VS Code Extension

A VS Code extension for Web3FuzzForge, an automated test scaffolding tool for Web3 developers.

## Features

### Template Generation

Quickly generate test templates for:
- Wallet connection flows
- Transaction signing
- Network switching
- Security testing scenarios

### Code Snippets

Use these snippets to speed up your test writing:
- `w3ff-connect` - Insert a wallet connection test
- `w3ff-tx` - Insert a transaction signing test
- `w3ff-network` - Insert a network switching test
- `w3ff-security` - Insert a security test template
- `w3ff-expect` - Insert wallet state assertions
- `w3ff-types` - Insert TypeScript type definitions (TS only)

### Inline Help

Hover over Web3FuzzForge functions and classes to see:
- Function descriptions
- Parameter requirements
- Usage examples

## Commands

Access through the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Web3FuzzForge: Generate Test Template** - Create a new test based on selected template
- **Web3FuzzForge: Show Help** - Display help documentation

## Configuration

Configure in VS Code settings:

- `web3fuzzforge.defaultWallet` - Default wallet to use for test generation
- `web3fuzzforge.defaultDappUrl` - Default URL of the dApp to test

## Requirements

- Visual Studio Code v1.60.0 or later
- Node.js v16 or later
- Web3FuzzForge CLI tool installed (`npm install -g web3fuzzforge`)

## Installation

1. Launch VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Web3FuzzForge"
4. Click Install

## Quick Start

1. Open your Web3 project in VS Code
2. Press Ctrl+Shift+P (or Cmd+Shift+P on macOS)
3. Type "Web3FuzzForge: Generate Test Template"
4. Follow the prompts to select test type and wallet
5. Edit the generated template to fit your specific test case

## Development

To build and run this extension from source:

```bash
# Clone the repository
git clone https://github.com/your-username/web3-security-test-kit.git
cd web3-security-test-kit/extensions/vscode

# Install dependencies
npm install

# Package the extension
npm run package

# Install the extension from the .vsix file
code --install-extension web3fuzzforge-vscode-0.1.0.vsix
```

## License

MIT 