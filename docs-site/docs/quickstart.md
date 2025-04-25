---
sidebar_position: 3
---

# Quickstart

## Run Your First Test in 5 Minutes

Get started with Web3FuzzForge in just 5 minutes:

1. **Install the package**
   ```bash
   npm install -g web3fuzzforge
   ```

2. **Generate a wallet connection test**
   ```bash
   web3fuzzforge generate connect --wallet metamask --out ./test.js
   ```

3. **Install testing dependencies**
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

4. **Run your first test**
   ```bash
   npx playwright test test.js --headed
   ```

That's it! You've just run your first automated Web3 test.

## Common Test Types

### Wallet Connection Test

```bash
web3fuzzforge generate connect --wallet metamask --out ./tests/connection.test.js
```

### Transaction Test

```bash
web3fuzzforge generate tx --wallet metamask --out ./tests/transaction.test.js
```

### Signature Test

```bash
web3fuzzforge generate sign --wallet metamask --out ./tests/sign.test.js
```

## Using TypeScript

All commands support TypeScript with the `--typescript` flag:

```bash
web3fuzzforge generate connect --wallet metamask --out ./tests/connection.test.ts --typescript
```

## Using Preset Configurations

For common application types, use the `--preset` flag:

```bash
# For ERC20/721 token applications
web3fuzzforge generate connect --preset erc --out ./tests/nft-connect-test.js

# For DeFi applications
web3fuzzforge generate tx --preset defi --out ./tests/defi-swap-test.js
```

## Running Tests

```bash
# In headless mode
npx playwright test tests/connection.test.js

# In headed mode for debugging
npx playwright test tests/connection.test.js --headed
```

## Next Steps

Explore the [Commands Reference](commands-reference) for all available options or check out [Advanced Guides](advanced-guides) for more complex scenarios.
