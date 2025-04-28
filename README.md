# Web3FuzzForge 🛡️

![Web3FuzzForge Banner](./assets/web3fuzzforge-banner.png)

Secure your Web3 dApps with automated fuzzing and transaction testing.

## 🚀 What is Web3FuzzForge?
Web3FuzzForge is a security-first test kit for Web3 applications.
It helps you:

- Simulate wallet connections and transactions
- Auto-generate fuzzing scenarios
- Quickly catch UI and interaction failures
- Detect security vulnerabilities

⚡ Built for fast prototyping, robust testing, and maximum dApp resilience.

## 🔥 Features
- **Multi-Wallet Support**: Test with MetaMask, WalletConnect, Coinbase, Phantom, and more
- **Security Test Generation**: Built-in fuzzing support and vulnerability detection
- **Wallet Snapshots**: Save and restore wallet states for complex test scenarios
- **Mock dApp Support**: Develop and run against a simulated environment
- **Playwright Integration**: Built on the powerful Playwright testing framework

## 🛠️ Installation
### Local Setup (Recommended)
```bash
npm install
npm run local-install
```
## ⚡ Quick Start
### Generate Tests
```bash
# Connection Test
web3fuzzforge generate connect --wallet metamask --out ./tests/connection-test.js

# Transaction Test
web3fuzzforge generate tx --wallet metamask --out ./tests/transaction-test.js

# Security Fuzzing Test
web3fuzzforge generate tx --wallet metamask --out ./tests/security-tx-test.js --fuzz
```

### See It In Action

![Web3FuzzForge Demo](./assets/demo.gif)

### Run Tests
```bash
# Against a mock dApp
web3fuzzforge run --mock-mode --headed

# Against a real dApp
web3fuzzforge run --target-url=https://your-dapp.com
```

## 🔮 Future Improvements

We're continuously improving Web3FuzzForge with a focus on:

| Phase | Timeline | Focus Areas |
|-------|----------|-------------|
| Phase 1 | Q3 2023 | Foundation Improvements (Error Handling, Basic Mocks, Documentation) |
| Phase 2 | Q4 2023 | Advanced Features (Comprehensive Mock System, Test Isolation, Interactive Documentation) |
| Phase 3 | Q1 2024 | Platform Extensions (Web UI, AI Test Generation, Cross-Chain Support) |

See our [Future Improvements](./docs/future-improvements-index.md) documentation for details.

## 🧠 Troubleshooting Tips
- Package Installation Errors? Use `npm run local-install`.
- UI Visibility Fails? Use `forceShowWalletUI` from /utils/wallet-snapshot.
- For more help, check our [FAQ](./docs/future-improvements-faq.md).

## 📜 License
MIT License.

Ready to automate your Web3 security tests?
⭐ Star the repo & join the Web3 security movement!