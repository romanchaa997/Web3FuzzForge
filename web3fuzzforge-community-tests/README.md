# Web3FuzzForge Community Tests

A collection of community-contributed security tests for Web3 applications. This repository is part of the Web3FuzzForge initiative to improve security testing across Web3 applications.

## 🔍 About

Web3FuzzForge Community Tests is a repository for sharing, collaborating on, and discovering security tests for Web3 applications. Our focus is on detecting edge cases, race conditions, and other potential vulnerabilities in dApps and wallet integrations.

## 🏆 Hall of Fame

Check out our [Hall of Fame](./HALL_OF_FAME.md) to see contributors who have submitted valuable test cases!

## 🧪 Test Categories

- **Wallet Connection Tests**: Test various edge cases in wallet connection flows
- **Transaction Flow Tests**: Find vulnerabilities in transaction creation and submission
- **Smart Contract Interaction Tests**: Test edge cases when interacting with smart contracts
- **UI/UX Security Tests**: Discover potential user-facing security issues

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Playwright

### Installation

```bash
git clone https://github.com/your-org/web3fuzzforge-community-tests.git
cd web3fuzzforge-community-tests
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run a specific test category
npm run test:wallet-connection
npm run test:transaction-flow
```

## 💡 Contributing

We welcome contributions from the community! Here's how you can contribute:

1. **Submit a Test Idea**: [Open an issue](https://github.com/your-org/web3fuzzforge-community-tests/issues/new?template=fuzz-idea.md) with the "Fuzz Idea" template
2. **Contribute a Test**: Fork the repo, add your test case, and submit a PR
3. **Improve Existing Tests**: Enhance test coverage or improve existing test cases

### Creating a New Test

1. Create a new test file in the appropriate directory:

   - `dapp-tests/wallet-connection/` for wallet connection tests
   - `dapp-tests/transaction-flow/` for transaction tests
   - Create a new directory if your test doesn't fit existing categories

2. Follow the template format:

   ```javascript
   /**
    * Test case description: Descriptive name of your test
    * Vulnerability/edge case: What vulnerability or edge case is being tested
    * Manual reproduction steps: How to manually reproduce this issue
    * Security impact: What could happen if this vulnerability exists
    */
   ```

3. Use the utilities in the `utils/` directory to help with testing.

4. Add appropriate assertions to verify the security properties.

5. Submit a pull request with your test!

### 🎖️ Recognition

All contributors who submit test cases will be added to our Hall of Fame! The Hall of Fame is automatically updated when your PR is merged.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
