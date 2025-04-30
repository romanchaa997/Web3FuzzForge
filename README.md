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

## 📚 Documentation

We've improved our documentation! Visit our comprehensive documentation site for detailed guides, tutorials, and examples:

```bash
# Start the documentation site locally
npm run docs
```

The documentation is now organized into clear sections:
- Introduction & Overview
- Installation & Quickstart
- Security Testing
- Wallet Integration
- Mobile Testing
- Cross-Chain Testing
- Vulnerability Categorization
- Reporting

## 📊 Enhanced Reporting

Web3FuzzForge now includes a structured reporting system with vulnerability categorization:

```bash
# Generate a comprehensive security report
npm run report:generate

# Export report to different formats
npm run report:export --format=json,html,pdf
```

## 📱 Mobile & Cross-Chain Testing

We've expanded support for mobile wallets and cross-chain testing:

```bash
# Set up mobile testing environment
npm run mobile:setup

# Set up cross-chain testing environment
npm run cross-chain:setup
```

## 🧩 Recent Improvements

We've made several key improvements to Web3FuzzForge:

1. **Centralized Documentation**: All documentation is now available in one place
2. **Enhanced Test Reporting**: Structured reporting with vulnerability categorization
3. **Mobile Wallet Testing**: Expanded support for mobile wallet interactions
4. **Cross-Chain Testing**: Support for testing across multiple blockchain networks
5. **Community Examples**: Real-world test examples for common vulnerabilities
6. **Performance Optimization**: Improved test execution speed

For detailed implementation steps, see the [Improvement Guide](./improvement-guide.md).

## 🔮 Future Improvements

We're continuously improving Web3FuzzForge with a focus on:

| Phase | Timeline | Focus Areas |
|-------|----------|-------------|
| Phase 1 | Q3 2023 | Foundation Improvements (Error Handling, Basic Mocks, Documentation) |
| Phase 2 | Q4 2023 | Advanced Features (Comprehensive Mock System, Test Isolation, Interactive Documentation) |
| Phase 3 | Q1 2024 | Platform Extensions (Web UI, AI Test Generation, Cross-Chain Support) |

## 🧠 Troubleshooting Tips
- Package Installation Errors? Use `npm run local-install`.
- UI Visibility Fails? Use `forceShowWalletUI` from /utils/wallet-snapshot.
- For more help, check the documentation site.

## 📜 License
MIT License.

Ready to automate your Web3 security tests?
⭐ Star the repo & join the Web3 security movement!