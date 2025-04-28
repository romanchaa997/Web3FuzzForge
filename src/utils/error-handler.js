/**
 * Enhanced error handling utilities
 */
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

// Define common error types and their solutions
const ERROR_TYPES = {
  MISSING_CONFIG: {
    regex: /config(.*)not found|cannot find(.*)config/i,
    message: 'Configuration file missing',
    solution: 'Run "web3fuzzforge init" to create a configuration file',
    hint: 'You can use --interactive flag for guided setup'
  },
  INVALID_CONFIG: {
    regex: /invalid(.*)config|config(.*)invalid/i,
    message: 'Invalid configuration format',
    solution: 'Run "web3fuzzforge validate" to check your configuration',
    hint: 'Make sure your JSON syntax is correct'
  },
  MISSING_DEPENDENCY: {
    regex: /cannot find module|module not found|require.resolve/i,
    message: 'Missing dependencies',
    solution: 'Run "npm install" to install all required dependencies',
    hint: 'Check your package.json for correct dependencies'
  },
  BROWSER_LAUNCH_ERROR: {
    regex: /browser(.*)failed|failed(.*)launch|launch(.*)browser/i,
    message: 'Browser launch failed',
    solution: 'Run "npx playwright install" to install required browsers',
    hint: 'Make sure you have the required system dependencies'
  },
  WALLET_CONNECTION_ERROR: {
    regex: /wallet(.*)connect|failed(.*)connect(.*)wallet/i,
    message: 'Wallet connection failed',
    solution: 'Check that your wallet is properly configured and unlocked',
    hint: 'Make sure the wallet extension is installed and enabled'
  },
  SELECTOR_ERROR: {
    regex: /selector(.*)not found|cannot find(.*)element/i,
    message: 'Element selector not found',
    solution: 'Update your configuration with the correct selector',
    hint: 'Use browser inspector to verify the correct selector'
  },
  NETWORK_ERROR: {
    regex: /network(.*)error|connection(.*)refused|ECONNREFUSED/i,
    message: 'Network connection error',
    solution: 'Check your internet connection and firewall settings',
    hint: 'Make sure the target dApp URL is accessible'
  },
  TIMEOUT_ERROR: {
    regex: /timeout|timed out/i,
    message: 'Operation timed out',
    solution: 'Increase timeout settings or check for network issues',
    hint: 'Consider using mock mode for faster testing'
  },
  PERMISSION_ERROR: {
    regex: /permission denied|EACCES|access denied/i,
    message: 'Permission denied',
    solution: 'Check file and directory permissions',
    hint: 'You might need to run with administrator/sudo privileges'
  }
}

/**
 * Process an error to provide helpful messages and solutions
 * @param {Error} error - The error object to process
 * @param {string} context - Context of where the error occurred
 * @returns {Object} Processed error with helpful information
 */
function processError(error, context = '') {
  const originalMessage = error.message || error.toString()
  
  // Try to match the error to known patterns
  let errorType = null
  for (const [key, type] of Object.entries(ERROR_TYPES)) {
    if (type.regex.test(originalMessage)) {
      errorType = { id: key, ...type }
      break
    }
  }
  
  // If no match found, use generic error handling
  if (!errorType) {
    errorType = {
      id: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      solution: 'Check logs for more details',
      hint: 'Try running with debug mode enabled'
    }
  }
  
  // Build detailed error object
  return {
    original: error,
    id: errorType.id,
    message: errorType.message,
    solution: errorType.solution,
    hint: errorType.hint,
    context: context,
    details: originalMessage,
    stack: error.stack
  }
}

/**
 * Display a user-friendly error message with solutions
 * @param {Error|string} error - The error to handle
 * @param {string} context - Context where the error occurred
 * @param {boolean} exitProcess - Whether to exit the process after handling
 * @returns {Object} The processed error information
 */
function handleError(error, context = '', exitProcess = false) {
  const processedError = processError(error, context)
  
  // Print formatted error message
  console.error(chalk.red('\n❌ Error: ') + chalk.bold(processedError.message))
  
  if (processedError.context) {
    console.error(chalk.yellow('Context: ') + processedError.context)
  }
  
  console.error(chalk.yellow('Details: ') + processedError.details)
  
  // Print solution
  console.error(chalk.green('\n✅ Solution: ') + processedError.solution)
  
  if (processedError.hint) {
    console.error(chalk.blue('💡 Hint: ') + processedError.hint)
  }
  
  // For debugging purposes, log stack trace when DEBUG is set
  if (process.env.DEBUG) {
    console.error(chalk.gray('\nStack trace:'))
    console.error(chalk.gray(processedError.stack || 'No stack trace available'))
  }
  
  // For missing dependencies, try to suggest the exact command
  if (processedError.id === 'MISSING_DEPENDENCY') {
    suggestDependencyFix(processedError.details)
  }
  
  // Exit process if requested
  if (exitProcess) {
    process.exit(1)
  }
  
  return processedError
}

/**
 * Suggest specific dependency installation commands
 * @param {string} errorDetails - Error details containing module name
 */
function suggestDependencyFix(errorDetails) {
  // Try to extract module name from error message
  const moduleMatch = errorDetails.match(/(?:module\s+['"])([^'"]+)/)
  
  if (moduleMatch && moduleMatch[1]) {
    const moduleName = moduleMatch[1]
    console.error(chalk.green('Try running: ') + `npm install --save ${moduleName}`)
  }
}

/**
 * Check for common environment issues before running commands
 * @returns {Promise<boolean>} True if environment is ready, false otherwise
 */
async function checkEnvironment() {
  let isReady = true
  const issues = []
  
  try {
    // Check Node.js version
    const nodeVersion = process.version
    const versionNum = nodeVersion.slice(1).split('.').map(Number)
    
    if (versionNum[0] < 16) {
      issues.push({
        issue: `Node.js version ${nodeVersion} is below minimum required (v16.0.0)`,
        solution: 'Update Node.js to v16.0.0 or higher'
      })
      isReady = false
    }
    
    // Check npm
    try {
      execSync('npm --version', { stdio: 'pipe' })
    } catch (e) {
      issues.push({
        issue: 'npm is not available',
        solution: 'Install npm package manager'
      })
      isReady = false
    }
    
    // Check Playwright browsers
    try {
      const browsersConfigPath = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'browsers.json')
      if (!fs.existsSync(browsersConfigPath)) {
        issues.push({
          issue: 'Playwright browsers not installed',
          solution: 'Run "npx playwright install" to install required browsers'
        })
        isReady = false
      }
    } catch (e) {
      // Ignore file check errors
    }
    
    // Display issues if any
    if (issues.length > 0) {
      console.error(chalk.red('\n❌ Environment check found issues:'))
      
      issues.forEach((item, index) => {
        console.error(chalk.yellow(`${index + 1}. ${item.issue}`))
        console.error(chalk.green(`   Solution: ${item.solution}`))
      })
      
      console.error(chalk.blue('\n💡 Fix these issues before proceeding for best results'))
    }
    
  } catch (error) {
    console.error(chalk.red('Error during environment check:'), error.message)
    isReady = false
  }
  
  return isReady
}

/**
 * Graceful degradation when dependencies are missing
 * @param {string} dependency - The missing dependency name
 * @param {Function} fallbackFn - Fallback function to run
 * @returns {Promise<any>} Result of the attempt
 */
async function gracefulDegradation(dependency, fallbackFn) {
  try {
    // Try to resolve the dependency
    const resolvedDep = require(dependency)
    return resolvedDep
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Optional dependency "${dependency}" is not available`))
    console.log(chalk.blue(`💡 Using fallback functionality instead`))
    
    // If the fallbackFn is provided, execute it
    if (typeof fallbackFn === 'function') {
      try {
        return await fallbackFn()
      } catch (fallbackError) {
        handleError(fallbackError, `Fallback for ${dependency}`)
        return null
      }
    }
    
    return null
  }
}

module.exports = {
  handleError,
  processError,
  checkEnvironment,
  gracefulDegradation
} 