const { OpenAI } = require('openai')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
require('dotenv').config()

// Add this function to initialize the OpenAI client only when needed
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set in environment variables. Please set it in your .env file or as an environment variable.'
    )
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

/**
 * Generate a config file using OpenAI API based on user prompt
 * @param {string} prompt - User prompt for config generation
 * @returns {Object} Generated configuration object
 */
async function generateConfigFromPrompt(prompt) {
  try {
    // Check API key and get client only when needed
    const openai = getOpenAIClient()

    console.log(chalk.blue(`Generating configuration from prompt: "${prompt}"`))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a specialized AI for creating Web3FuzzForge test configurations. 
          Based on the user's prompt, generate a JSON configuration file for Web3 security testing.
          The configuration should be valid JSON and include appropriate values for wallet provider, 
          language, test addresses, amount values, network information, and other relevant settings.
          Only respond with the valid JSON configuration object, no explanation or additional text.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    // Extract the JSON content from OpenAI's response
    const configContent = response.choices[0].message.content.trim()

    // Parse the config to validate it's proper JSON
    try {
      const parsedConfig = JSON.parse(configContent)
      console.log(chalk.green('Configuration generated successfully'))
      return parsedConfig
    } catch (parseError) {
      console.error(chalk.red(`Error parsing generated config: ${parseError.message}`))
      console.log(
        chalk.yellow(
          'Generated content was not valid JSON. Please try again with a clearer prompt.'
        )
      )
      console.log(chalk.gray('Raw response:'), configContent)
      process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red(`OpenAI API Error: ${error.message}`))
    if (error.response) {
      console.error(chalk.red(`Response status: ${error.response.status}`))
      console.error(chalk.red(`Response data: ${JSON.stringify(error.response.data)}`))
    }
    process.exit(1)
  }
}

/**
 * Save the generated configuration to .web3fuzzforge.json
 * @param {Object} config - Configuration object to save
 * @returns {string} Path to the saved config file
 */
async function saveGeneratedConfig(config) {
  try {
    const configPath = path.join(process.cwd(), '.web3fuzzforge.json')
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')
    console.log(chalk.green(`Configuration saved to ${configPath}`))
    return configPath
  } catch (error) {
    console.error(chalk.red(`Error saving configuration: ${error.message}`))
    process.exit(1)
  }
}

module.exports = {
  generateConfigFromPrompt,
  saveGeneratedConfig,
}
