# Web3 Mock dApp for Testing

A simple Web3 dApp for testing the Web3 Security Test Kit. This mock application provides basic wallet connection functionality that can be used for automated tests.

## Features

- Wallet connection button with MetaMask, Coinbase Wallet, and WalletConnect support
- Display of connected wallet address and provider
- Mock transaction button for testing transaction flows
- Clean, responsive UI

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Navigate to the mock dApp directory:

```bash
cd mocked-sample-app
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm start
# or
yarn start
```

The app will be available at `http://localhost:3000`.

## Using with Web3 Security Test Kit

This mock dApp is designed to work with the Web3 Security Test Kit. You can run tests against it using the `--mock-mode` flag:

```bash
npx playwright test --mock-mode
```

Or specify it as a target URL:

```bash
npx playwright test --target-url=http://localhost:3000
```

## UI Elements for Testing

The following UI elements have IDs for easy targeting in tests:

- `#connect-button`: The button to connect a wallet
- `#wallet-info`: The container displaying wallet information after connection
- `.wallet-address`: The element displaying the connected wallet address
- `#send-transaction-button`: A mock transaction button

## Docker

You can also run the mock dApp in Docker:

```bash
# Build the Docker image
docker build -t web3-mock-dapp .

# Run the container
docker run -p 3000:3000 web3-mock-dapp
```

## License

This project is licensed under the MIT License.
