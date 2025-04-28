const fs = require('fs');
const path = require('path');

// Regex patterns for common security issues
const SECURITY_PATTERNS = {
  PRIVATE_KEY: /['"]([0-9a-fA-F]{64})['"]/,
  API_KEY: /['"](0x)?[0-9a-fA-F]{32,64}['"]/,
  INFURA_KEY: /['"](https?:\/\/)?[a-z0-9]+\.infura\.io\/v3\/[0-9a-fA-F]{32}['"]/i,
  ALCHEMY_KEY: /['"](https?:\/\/)?[a-z0-9-]+\.alchemy\.com\/v2\/[0-9a-zA-Z]{32}['"]/i,
  HARDCODED_ADDRESS: /['"]0x[a-fA-F0-9]{40}['"]/,
  UNSAFE_TRANSFER: /\.transfer\(/,
  UNSAFE_SEND: /\.send\(/,
  // Additional security patterns
  INLINE_ASSEMBLY: /assembly\s*{/,
  DELEGATECALL: /\.delegatecall\(/,
  SELFDESTRUCT: /selfdestruct|suicide/,
  TIMESTAMP_DEPENDENCY: /block\.timestamp|now/,
  UNCHECKED_RETURN: /\.call\{.*\}\([^;]*\)[^;]*(?!;|\s*returns|\s*revert)/,
  REENTRANCY_VULNERABLE: /\.call\{.*\}\([^;]*\)[^;]*;(?!\s*_locked\s*=)/
};

/**
 * Scans source files for potential security issues
 * @param {string} directory - Directory to scan
 * @param {Array<string>} extensions - File extensions to scan
 * @returns {Object} Found security issues by category
 */
async function scanSourceForSecurityIssues(directory, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
  const issues = {
    privateKeys: [],
    apiKeys: [],
    infuraKeys: [],
    alchemyKeys: [],
    hardcodedAddresses: [],
    unsafeTransfers: []
  };

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for private keys
      if (SECURITY_PATTERNS.PRIVATE_KEY.test(line)) {
        issues.privateKeys.push({ file: filePath, line: index + 1, content: line });
      }

      // Check for API keys
      if (SECURITY_PATTERNS.API_KEY.test(line)) {
        issues.apiKeys.push({ file: filePath, line: index + 1, content: line });
      }

      // Check for Infura keys
      if (SECURITY_PATTERNS.INFURA_KEY.test(line)) {
        issues.infuraKeys.push({ file: filePath, line: index + 1, content: line });
      }

      // Check for Alchemy keys
      if (SECURITY_PATTERNS.ALCHEMY_KEY.test(line)) {
        issues.alchemyKeys.push({ file: filePath, line: index + 1, content: line });
      }

      // Check for hardcoded addresses
      if (SECURITY_PATTERNS.HARDCODED_ADDRESS.test(line)) {
        issues.hardcodedAddresses.push({ file: filePath, line: index + 1, content: line });
      }

      // Check for unsafe transfer/send usage
      if (SECURITY_PATTERNS.UNSAFE_TRANSFER.test(line) || SECURITY_PATTERNS.UNSAFE_SEND.test(line)) {
        issues.unsafeTransfers.push({ file: filePath, line: index + 1, content: line });
      }
    });
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        }
      } else if (extensions.includes(path.extname(file))) {
        scanFile(filePath);
      }
    });
  }

  scanDirectory(directory);
  return issues;
}

/**
 * Validates transaction parameters for security issues
 * @param {Object} tx - Transaction object
 * @returns {Array<string>} Array of validation errors
 */
function validateTransactionSecurity(tx) {
  const errors = [];

  // Check for required fields
  if (!tx.from) errors.push('Missing sender address');
  if (!tx.to) errors.push('Missing recipient address');
  if (!tx.value && tx.value !== 0) errors.push('Missing transaction value');

  // Validate addresses
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (tx.from && !addressRegex.test(tx.from)) errors.push('Invalid sender address format');
  if (tx.to && !addressRegex.test(tx.to)) errors.push('Invalid recipient address format');

  // Check for chainId to prevent replay attacks
  if (!tx.chainId) errors.push('Missing chainId - vulnerable to replay attacks');

  // Validate gas parameters
  if (tx.gasLimit && (isNaN(tx.gasLimit) || tx.gasLimit <= 0)) {
    errors.push('Invalid gas limit');
  }

  if (tx.maxFeePerGas && tx.gasPrice) {
    errors.push('Cannot specify both maxFeePerGas and gasPrice');
  }

  // Check for data field format if present
  if (tx.data && !/^0x([0-9a-fA-F]{2})*$/.test(tx.data)) {
    errors.push('Invalid data field format');
  }

  return errors;
}

/**
 * Checks if an RPC endpoint is secure
 * @param {string} rpcUrl - RPC endpoint URL
 * @returns {boolean} True if secure, false otherwise
 */
function isSecureRpcEndpoint(rpcUrl) {
  try {
    const url = new URL(rpcUrl);
    return url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Validates smart contract interaction parameters
 * @param {Object} params - Contract interaction parameters
 * @returns {Array<string>} Array of validation errors
 */
function validateContractInteraction(params) {
  const errors = [];

  // Check contract address
  if (!params.address || !/^0x[a-fA-F0-9]{40}$/.test(params.address)) {
    errors.push('Invalid contract address');
  }

  // Validate function signature
  if (!params.functionSignature || !/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/.test(params.functionSignature)) {
    errors.push('Invalid function signature format');
  }

  // Check parameters
  if (params.parameters) {
    if (!Array.isArray(params.parameters)) {
      errors.push('Parameters must be an array');
    } else {
      // Basic type checking for parameters
      params.parameters.forEach((param, index) => {
        if (param === undefined || param === null) {
          errors.push(`Parameter at index ${index} is undefined or null`);
        }
      });
    }
  }

  return errors;
}

/**
 * Validates EIP-712 typed data for signature security
 * @param {Object} typedData - The EIP-712 typed data object
 * @returns {Array<string>} Array of validation errors
 */
function validateTypedDataSecurity(typedData) {
  const errors = [];

  // Check required fields
  if (!typedData.types) errors.push('Missing types definition');
  if (!typedData.primaryType) errors.push('Missing primaryType');
  if (!typedData.domain) errors.push('Missing domain object');
  if (!typedData.message) errors.push('Missing message object');

  // Validate domain object
  if (typedData.domain) {
    if (!typedData.domain.name) errors.push('Missing domain name');
    if (!typedData.domain.version) errors.push('Missing domain version');
    if (!typedData.domain.chainId) errors.push('Missing domain chainId');
    if (!typedData.domain.verifyingContract) {
      errors.push('Missing domain verifyingContract');
    }
  }

  // Validate types
  if (typedData.types) {
    if (!typedData.types[typedData.primaryType]) {
      errors.push(`Missing type definition for primaryType: ${typedData.primaryType}`);
    }

    // Check for circular dependencies in types
    const visited = new Set();
    const checkCircular = (typeName) => {
      if (visited.has(typeName)) {
        errors.push(`Circular dependency detected in type: ${typeName}`);
        return;
      }
      visited.add(typeName);
      const type = typedData.types[typeName];
      if (type) {
        type.forEach(field => {
          if (typedData.types[field.type]) {
            checkCircular(field.type);
          }
        });
      }
      visited.delete(typeName);
    };

    checkCircular(typedData.primaryType);
  }

  return errors;
}

/**
 * Validates contract bytecode for known vulnerabilities
 * @param {string} bytecode - Contract bytecode
 * @returns {Array<string>} Array of potential vulnerabilities
 */
function validateContractBytecode(bytecode) {
  const vulnerabilities = [];

  // Remove '0x' prefix if present
  bytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;

  // Check for delegatecall opcode (0xF4)
  if (bytecode.includes('f4')) {
    vulnerabilities.push('Contains DELEGATECALL opcode - potential security risk');
  }

  // Check for selfdestruct opcode (0xFF)
  if (bytecode.includes('ff')) {
    vulnerabilities.push('Contains SELFDESTRUCT opcode - potential security risk');
  }

  // Check for timestamp dependency (0x42)
  if (bytecode.includes('42')) {
    vulnerabilities.push('Contains TIMESTAMP opcode - potential manipulation risk');
  }

  // Check for unchecked external calls
  if (bytecode.includes('f1') && !bytecode.includes('60203d')) {
    vulnerabilities.push('Contains unchecked external calls - potential reentrancy risk');
  }

  return vulnerabilities;
}

/**
 * Validates and sanitizes user input for XSS and injection attacks
 * @param {string} input - User input to validate
 * @returns {Object} Validation result and sanitized input
 */
function validateAndSanitizeInput(input) {
  const result = {
    isValid: true,
    sanitized: input,
    errors: []
  };

  // Skip validation for Ethereum addresses
  if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
    return result;
  }

  // Check for potential XSS
  if (/<script|javascript:|data:|on\w+\s*=|<img|<iframe/i.test(input)) {
    result.isValid = false;
    result.errors.push('Potential XSS attack detected');
  }

  // Check for SQL injection attempts
  if (/['";]|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b/i.test(input)) {
    result.isValid = false;
    result.errors.push('Potential SQL injection detected');
  }

  // Check for command injection attempts
  if (/[&|;`]|\$\(|\b(cat|echo|rm|mv|cp|chmod|sudo|bash|sh)\b/i.test(input)) {
    result.isValid = false;
    result.errors.push('Potential command injection detected');
  }

  // Sanitize input
  result.sanitized = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;&|`$]/g, '') // Remove command separators and special chars
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b/gi, '') // Remove SQL keywords
    .replace(/\b(cat|echo|rm|mv|cp|chmod|sudo|bash|sh)\b/gi, '') // Remove shell commands
    .trim();

  return result;
}

/**
 * Validates gas parameters for potential issues
 * @param {Object} gasParams - Gas parameters object
 * @returns {Array<string>} Array of validation errors
 */
function validateGasParameters(gasParams) {
  const errors = [];

  // Check for EIP-1559 parameters
  if (gasParams.maxFeePerGas) {
    if (typeof gasParams.maxFeePerGas !== 'string' || !/^0x[0-9a-fA-F]+$/.test(gasParams.maxFeePerGas)) {
      errors.push('Invalid maxFeePerGas format');
    }
    if (gasParams.maxPriorityFeePerGas === undefined) {
      errors.push('maxPriorityFeePerGas required when using maxFeePerGas');
    }
  }

  // Check for legacy gas price
  if (gasParams.gasPrice) {
    if (typeof gasParams.gasPrice !== 'string' || !/^0x[0-9a-fA-F]+$/.test(gasParams.gasPrice)) {
      errors.push('Invalid gasPrice format');
    }
    if (gasParams.maxFeePerGas || gasParams.maxPriorityFeePerGas) {
      errors.push('Cannot mix EIP-1559 and legacy gas parameters');
    }
  }

  // Validate gas limit
  if (gasParams.gas || gasParams.gasLimit) {
    const limit = gasParams.gas || gasParams.gasLimit;
    if (typeof limit !== 'string' || !/^0x[0-9a-fA-F]+$/.test(limit)) {
      errors.push('Invalid gas limit format');
    }
    // Check if gas limit is too high (> 30M)
    const gasLimitNum = parseInt(limit, 16);
    if (gasLimitNum > 30000000) {
      errors.push('Gas limit exceeds safe maximum (30M)');
    }
  }

  return errors;
}

module.exports = {
  SECURITY_PATTERNS,
  scanSourceForSecurityIssues,
  validateTransactionSecurity,
  isSecureRpcEndpoint,
  validateContractInteraction,
  validateTypedDataSecurity,
  validateContractBytecode,
  validateAndSanitizeInput,
  validateGasParameters
}; 