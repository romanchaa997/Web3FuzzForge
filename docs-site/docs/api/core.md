---
id: core
title: Core API
sidebar_label: Core API
---

# Core API Reference

The Core API provides the fundamental building blocks for working with Web3FuzzForge.

## Configuration

### `initializeConfig(options)`

Initializes the Web3FuzzForge configuration with the specified options.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| options | `ConfigOptions` | Configuration options object |

**Returns:** `Config` - The initialized configuration object

**Example:**

```javascript
const { initializeConfig } = require('web3fuzzforge');

const config = initializeConfig({
  projectName: 'My dApp Tests',
  targetUrl: 'https://my-dapp.example.com',
  walletType: 'metamask',
  network: 'ethereum-mainnet',
  testTimeout: 30000
});
```

### `ConfigOptions`

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| projectName | `string` | No | `'Web3FuzzForge Project'` | Name of the test project |
| targetUrl | `string` | Yes | - | URL of the dApp to test |
| walletType | `string` | No | `'metamask'` | Wallet to use for testing |
| network | `string` | No | `'ethereum-mainnet'` | Network to connect to |
| testTimeout | `number` | No | `60000` | Test timeout in milliseconds |

## Test Management

### `createTest(name, options)`

Creates a new test with the specified name and options.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| name | `string` | Name of the test |
| options | `TestOptions` | Test configuration options |

**Returns:** `Test` - The created test object

**Example:**

```javascript
const { createTest } = require('web3fuzzforge');

const test = createTest('Wallet Connection Test', {
  description: 'Test wallet connection to dApp',
  tags: ['wallet', 'connection'],
  priority: 'high'
});
```

## Test Execution

### `runTests(tests, options)`

Runs the specified tests with the given options.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| tests | `Test[]` | Array of tests to run |
| options | `RunOptions` | Options for test execution |

**Returns:** `Promise<TestResult[]>` - Results of the test execution

**Example:**

```javascript
const { runTests } = require('web3fuzzforge');

async function executeTests() {
  const results = await runTests([walletTest, transactionTest], {
    parallel: true,
    retries: 1,
    reportFormat: 'html'
  });
  
  console.log(`Tests completed. Passed: ${results.filter(r => r.passed).length}`);
}
``` 