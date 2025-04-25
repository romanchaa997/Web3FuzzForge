# Testing in Different Environments

This guide explains how to run Web3 Security Test Kit tests against different environments.

## Testing Modes

The Web3 Security Test Kit supports two testing modes:

1. **Mock Mode**: Tests run against a built-in mock dApp that simulates Web3 wallet connections
2. **Real Target Mode**: Tests run against a real dApp URL that you specify

Either `--mock-mode` or `--target-url` flag **must** be specified when running tests.

## Using Mock Mode

Mock mode starts a local web server with a simple dApp that provides wallet connection functionality.

### Features of the Mock dApp

- Wallet connection button
- Display of connected wallet address
- Mock transaction UI
- Support for MetaMask, Coinbase Wallet, and WalletConnect

### Running Tests in Mock Mode

```bash
# Using npx directly
npx playwright test --mock-mode

# Using the CLI tool
web3fuzzforge run --mock-mode
```

The mock server automatically starts before tests run and shuts down when tests complete.

## Testing Against Real dApps

For testing against real dApps, use the `--target-url` flag.

### Running Tests Against a Real dApp

```bash
# Using npx directly
npx playwright test --target-url=https://your-dapp-url.com

# Using the CLI tool
web3fuzzforge run --target-url=https://your-dapp-url.com
```

### Considerations for Real dApp Testing

1. **Connection Settings**: Ensure your dApp uses compatible selectors for elements like connect buttons (`#connect-button`) or wallet info displays (`#wallet-info`).

2. **Network Requirements**: Tests will need access to the blockchain network your dApp uses.

3. **Test Accounts**: For tests that perform transactions, you'll need test accounts with sufficient funds.

## Running Tests with Docker

You can run tests against a dockerized version of your dApp:

```bash
# Start your dApp in Docker
docker run -p 3000:3000 your-dapp-image

# Run tests against it
web3fuzzforge run --target-url=http://localhost:3000
```

## Running Tests with Local Node.js Server

For local development:

```bash
# In one terminal, start your dApp
cd your-dapp
npm start

# In another terminal, run tests
cd web3-security-test-kit
web3fuzzforge run --target-url=http://localhost:3000
```

## Additional Options

Combine testing mode flags with other options:

```bash
# Run in headed mode to see the browser
web3fuzzforge run --mock-mode --headed

# Run in debug mode
web3fuzzforge run --target-url=http://localhost:3000 --debug

# Generate and open HTML report
web3fuzzforge run --mock-mode --report

# Run only tests matching a pattern
web3fuzzforge run --mock-mode --grep="MetaMask"
```

## Troubleshooting

- **Connection Issues**: If tests fail to connect to wallets, check that your wallet extension is properly installed and configured.

- **Selector Errors**: If tests can't find elements, ensure the selectors in your tests match those in your dApp.

- **Mock dApp Port Conflict**: If port 3000 is already in use, modify the port in `mocked-sample-app/vite.config.ts`.
