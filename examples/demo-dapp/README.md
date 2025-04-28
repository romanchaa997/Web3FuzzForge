# Web3 Demo dApp

A minimal demonstration application that showcases typical Web3 patterns for testing with the Web3 Security Test Kit.

## Features

- **Wallet Connection**: Connect to MetaMask and other Web3 wallets
- **Transaction Interactions**: Send ETH and ERC20 token transfers
- **Message Signing**: Sign regular messages and typed data (EIP-712)
- **Security Test Cases**: Intentional vulnerabilities for security testing

## Installation

```bash
cd examples/demo-dapp
npm install
```

## Usage

Start the development server:

```bash
npm start
```

This will launch the demo dApp at http://localhost:1234.

## Testing with Web3 Security Test Kit

This demo dApp is designed to work with the test templates out of the box. The application includes common Web3 patterns:

1. **Wallet Connection**: Standard Web3 connection flow with event handling
2. **Transaction Flow**: ETH transfers and ERC20 token interactions
3. **Signing Flow**: Both standard message signing and typed data (EIP-712) signing
4. **Security Test Cases**: Patterns that could represent security vulnerabilities

## UI Elements and Selectors

For testing purposes, the application uses standard HTML selectors:

- Connect Wallet Button: `#connect-wallet`
- Wallet Address Display: `#wallet-address`
- Send Transaction Button: `#send-transaction`
- Token Transfer Button: `#token-transfer`
- Sign Message Button: `#sign-message`
- Sign Typed Data Button: `#sign-typed-data`
- Security Test Buttons: 
  - `#execute-vulnerable`
  - `#request-multiple-approvals`

## Security Testing Scenarios

The application includes intentional "vulnerabilities" for security testing:

1. **Multiple Requests Without Confirmation**: Simulates a dApp that sends multiple high-risk transactions without clear user consent
2. **Multiple Approval Requests**: Requests approvals for multiple tokens in sequence to test wallet behavior
3. **Request for Unlimited Approval**: Test for excessive token approvals

## License

MIT 