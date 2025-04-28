const { test, expect } = require('@playwright/test');
const {
  SECURITY_PATTERNS,
  scanSourceForSecurityIssues,
  validateTransactionSecurity,
  isSecureRpcEndpoint,
  validateContractInteraction,
  validateTypedDataSecurity,
  validateContractBytecode,
  validateAndSanitizeInput,
  validateGasParameters
} = require('./security-test-helpers');

const path = require('path');
const fs = require('fs');

test.describe('Security Test Helpers', () => {
  test('SECURITY_PATTERNS should match known vulnerable patterns', () => {
    const testCases = {
      PRIVATE_KEY: {
        valid: "'1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'",
        invalid: "1234567890abcdef" // No quotes
      },
      API_KEY: {
        valid: '"0x1234567890abcdef1234567890abcdef"',
        invalid: '1234' // Too short
      },
      INFURA_KEY: {
        valid: '"https://mainnet.infura.io/v3/1234567890abcdef1234567890abcdef"',
        invalid: '"https://example.com"' // Not an Infura URL
      },
      HARDCODED_ADDRESS: {
        valid: "'0x1234567890123456789012345678901234567890'",
        invalid: "0x1234" // No quotes and too short
      }
    };

    for (const [pattern, cases] of Object.entries(testCases)) {
      expect(SECURITY_PATTERNS[pattern].test(cases.valid), 
        `${pattern} should match ${cases.valid}`).toBeTruthy();
      expect(SECURITY_PATTERNS[pattern].test(cases.invalid),
        `${pattern} should not match ${cases.invalid}`).toBeFalsy();
    }
  });

  test('scanSourceForSecurityIssues should detect vulnerabilities', async () => {
    // Create a temporary test file
    const testDir = path.join(__dirname, 'test-files');
    const testFile = path.join(testDir, 'test.js');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }

    const vulnerableCode = `
      const privateKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const apiKey = '0x1234567890abcdef1234567890abcdef';
      const infuraUrl = 'https://mainnet.infura.io/v3/1234567890abcdef1234567890abcdef';
      const address = '0x1234567890123456789012345678901234567890';
      contract.transfer(amount);
    `;

    fs.writeFileSync(testFile, vulnerableCode);

    const issues = await scanSourceForSecurityIssues(testDir);
    
    expect(issues.privateKeys.length).toBeGreaterThan(0);
    expect(issues.apiKeys.length).toBeGreaterThan(0);
    expect(issues.infuraKeys.length).toBeGreaterThan(0);
    expect(issues.hardcodedAddresses.length).toBeGreaterThan(0);
    expect(issues.unsafeTransfers.length).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
  });

  test('validateTransactionSecurity should validate transaction parameters', () => {
    const validTx = {
      from: '0x1234567890123456789012345678901234567890',
      to: '0x1234567890123456789012345678901234567890',
      value: '0x1',
      chainId: 1
    };

    const invalidTx = {
      from: '0x123', // Invalid address
      value: null,
      chainId: null
    };

    expect(validateTransactionSecurity(validTx)).toEqual([]);
    expect(validateTransactionSecurity(invalidTx).length).toBeGreaterThan(0);
  });

  test('isSecureRpcEndpoint should validate RPC endpoints', () => {
    expect(isSecureRpcEndpoint('https://mainnet.infura.io')).toBeTruthy();
    expect(isSecureRpcEndpoint('http://localhost:8545')).toBeFalsy();
    expect(isSecureRpcEndpoint('invalid-url')).toBeFalsy();
  });

  test('validateContractInteraction should validate contract calls', () => {
    const validParams = {
      address: '0x1234567890123456789012345678901234567890',
      functionSignature: 'transfer(address,uint256)',
      parameters: ['0x1234567890123456789012345678901234567890', '1000000000']
    };

    const invalidParams = {
      address: '0x123', // Invalid address
      functionSignature: 'invalid-signature',
      parameters: 'not-an-array'
    };

    expect(validateContractInteraction(validParams)).toEqual([]);
    expect(validateContractInteraction(invalidParams).length).toBeGreaterThan(0);
  });

  test('validateTypedDataSecurity should validate EIP-712 typed data', () => {
    const validTypedData = {
      types: {
        Person: [{ name: 'name', type: 'string' }]
      },
      primaryType: 'Person',
      domain: {
        name: 'Test App',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890'
      },
      message: {
        name: 'John Doe'
      }
    };

    const invalidTypedData = {
      types: {},
      message: {}
    };

    expect(validateTypedDataSecurity(validTypedData)).toEqual([]);
    expect(validateTypedDataSecurity(invalidTypedData).length).toBeGreaterThan(0);
  });

  test('validateContractBytecode should detect dangerous opcodes', () => {
    const dangerousBytecode = '0x60806040f4ff42'; // Contains delegatecall, selfdestruct, and timestamp
    const safeBytecode = '0x6080604052';

    expect(validateContractBytecode(dangerousBytecode).length).toBeGreaterThan(0);
    expect(validateContractBytecode(safeBytecode)).toEqual([]);
  });

  test('validateAndSanitizeInput should detect and sanitize malicious input', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '$(rm -rf /)',
      '0x1234567890123456789012345678901234567890' // Valid address should pass
    ];

    maliciousInputs.forEach(input => {
      const result = validateAndSanitizeInput(input);
      if (input.startsWith('0x')) {
        expect(result.isValid).toBeTruthy();
      } else {
        expect(result.isValid).toBeFalsy();
        expect(result.sanitized).not.toEqual(input);
      }
    });
  });

  test('validateGasParameters should validate gas parameters', () => {
    const validEIP1559Params = {
      maxFeePerGas: '0x5208',
      maxPriorityFeePerGas: '0x1',
      gasLimit: '0x5208'
    };

    const validLegacyParams = {
      gasPrice: '0x5208',
      gasLimit: '0x5208'
    };

    const invalidParams = {
      maxFeePerGas: '0x5208',
      gasPrice: '0x5208', // Can't mix EIP-1559 and legacy
      gasLimit: 'invalid'
    };

    expect(validateGasParameters(validEIP1559Params)).toEqual([]);
    expect(validateGasParameters(validLegacyParams)).toEqual([]);
    expect(validateGasParameters(invalidParams).length).toBeGreaterThan(0);
  });
}); 