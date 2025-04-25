const fs = require('fs-extra')
const path = require('path')
const Ajv = require('ajv')
const chalk = require('chalk')

// Initialize Ajv
const ajv = new Ajv({ allErrors: true })

/**
 * Load and validate the configuration schema
 * @returns {Object} Compiled validator function
 */
function getValidator() {
  try {
    const schemaPath = path.join(__dirname, 'config-schema.json')
    
    // Check if schema file exists
    if (!fs.existsSync(schemaPath)) {
      console.error(chalk.red(`Schema file not found: ${schemaPath}`))
      // Create an empty validator that accepts anything
      return () => true
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    try {
      // Parse the schema
      const parsedSchema = JSON.parse(schema)
      return ajv.compile(parsedSchema)
    } catch (parseError) {
      console.error(chalk.red(`Error parsing schema: ${parseError.message}`))
      // Create an empty validator that accepts anything
      return () => true
    }
  } catch (error) {
    console.error(chalk.red(`Error loading schema: ${error.message}`))
    // Create an empty validator that accepts anything
    return () => true
  }
}

/**
 * Validate configuration object against schema
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateConfig(config) {
  const validate = getValidator()
  if (!validate) {
    return {
      isValid: false,
      errors: ['Failed to load schema for validation'],
    }
  }

  const isValid = validate(config)
  return {
    isValid,
    errors: isValid ? [] : formatErrors(validate.errors),
  }
}

/**
 * Format AJV error messages for better readability
 * @param {Array} errors - AJV error objects
 * @returns {Array} Formatted error messages
 */
function formatErrors(errors) {
  return errors.map(error => {
    const property = error.instancePath.replace(/^\//, '') || '<root>'

    switch (error.keyword) {
      case 'enum':
        return `Property "${property}" must be one of: ${error.params.allowedValues.join(', ')}`
      case 'type':
        return `Property "${property}" must be of type: ${error.params.type}`
      case 'required':
        return `Missing required property: "${error.params.missingProperty}"`
      default:
        return `Error in "${property}": ${error.message}`
    }
  })
}

/**
 * Load the configuration file and validate it
 * @param {string} configPath - Path to the configuration file (optional)
 * @returns {Object} Validation result with config, isValid flag, and any errors
 */
function loadAndValidateConfig(configPath = null) {
  configPath = configPath || path.join(process.cwd(), '.web3fuzzforge.json')

  try {
    // Check if the file exists
    if (!fs.existsSync(configPath)) {
      return {
        config: null,
        isValid: false,
        errors: [`Configuration file not found: ${configPath}`],
        fileExists: false,
      }
    }

    // Read and parse the file
    const configContent = fs.readFileSync(configPath, 'utf8')
    try {
      const config = JSON.parse(configContent)
      const validation = validateConfig(config)

      return {
        config,
        isValid: validation.isValid,
        errors: validation.errors,
        fileExists: true,
        parseError: false,
      }
    } catch (parseError) {
      // Handle JSON parsing errors
      return {
        config: null,
        isValid: false,
        errors: [`Invalid JSON format: ${parseError.message}`],
        fileExists: true,
        parseError: true,
      }
    }
  } catch (error) {
    // Handle file system errors
    return {
      config: null,
      isValid: false,
      errors: [`Error loading configuration: ${error.message}`],
      fileExists: false,
    }
  }
}

/**
 * Generate a default configuration file
 * @returns {Object} Default configuration object
 */
function generateDefaultConfig() {
  return {
    wallet: 'metamask',
    dapp_url: 'https://app.uniswap.org',
    connect_button_selector: '.connect-wallet-button',
    lang: 'js',
    out: './tests/test.js',
    lint: true,
  }
}

/**
 * Create a new configuration file with default values
 * @param {string} configPath - Path to save the configuration file (optional)
 * @returns {Object} Result with success flag and message
 */
function createDefaultConfig(configPath = null) {
  configPath = configPath || path.join(process.cwd(), '.web3fuzzforge.json')

  try {
    const defaultConfig = generateDefaultConfig()
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')

    return {
      success: true,
      message: `Created default configuration file at: ${configPath}`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to create configuration file: ${error.message}`,
    }
  }
}

module.exports = {
  validateConfig,
  loadAndValidateConfig,
  generateDefaultConfig,
  createDefaultConfig,
}
