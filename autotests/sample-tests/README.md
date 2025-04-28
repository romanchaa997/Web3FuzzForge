# Web3 Security Test Examples

This directory contains sample test cases for Web3 applications, designed to showcase best practices for security testing and automation.

## Test Organization

The tests are organized by category:

1. **Wallet Connection Tests** - Tests wallet connection functionality and error handling
2. **Transaction Tests** - Tests basic transaction flows and ERC20 token transfers
3. **Signing Tests** - Tests message signing and EIP-712 typed data signing
4. **Security-Focused Tests** - Tests for common security vulnerabilities
5. **End-to-End Tests** - Complex test scenarios combining multiple aspects

## Test Files

| File | Description | Security Focus |
|------|-------------|----------------|
| `connection-test.test.js` | Basic wallet connection tests | Connection state management, error handling |
| `transaction-test.test.js` | ETH and token transaction tests | Input validation, transaction confirmation |
| `signing-test.test.js` | Message and typed data signing tests | Signature validation, error handling |
| `security-test.test.js` | Security-specific test cases | Multiple approvals, unlimited approvals, silent transactions |
| `end-to-end-workflow.test.js` | Complex workflow testing | End-to-end security validation |

## Running the Tests

These tests are designed to work with the demo dApp found in `examples/demo-dapp/`. Before running the tests:

1. Start the demo dApp:
   ```
   cd examples/demo-dapp
   npm install
   npm start
   ```

2. Run a specific test:
   ```
   npx playwright test autotests/sample-tests/connection-test.test.js --headed
   ```

3. Run all tests:
   ```
   npx playwright test autotests/sample-tests/ --headed
   ```

## Security Testing Best Practices

The sample tests demonstrate these security testing best practices:

### Wallet Connection
- Verify clear connection status indication
- Test rejection and error scenarios
- Validate network identification

### Transaction Testing
- Verify transaction details are displayed clearly
- Test input validation and error handling
- Check for multiple transactions without clear consent
- Monitor approval amounts

### Signature Testing
- Validate what is being signed
- Check for malicious message formatting
- Test error handling scenarios

### Security-Specific
- Detect multiple sequential transactions
- Identify unlimited approvals
- Test edge cases and error handling

## Adding New Tests

When adding new tests:

1. Use the utilities in `utils/wallet-setup.js`
2. Follow the pattern of existing tests
3. Include clear security considerations
4. Add proper error handling and validation
5. Document security findings 