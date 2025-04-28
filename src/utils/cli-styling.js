/**
 * CLI Styling Utility
 * 
 * Provides consistent branding and styling for CLI output
 * throughout the Web3FuzzForge application.
 */

const chalk = require('chalk');
const ora = require('ora'); // Make sure to npm install ora for spinners

// Brand color constants
const COLORS = {
  primary: '#3778FF',
  secondary: '#6147FF',
  accent: '#b947ff',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  gray: '#95a5a6'
};

// CLI Brand elements
const BRAND_PREFIX = chalk.hex(COLORS.primary).bold('Web3FuzzForge');
const BRAND_VERSION = process.env.npm_package_version || '1.1.0';
const BRAND_HEADER = `${BRAND_PREFIX} v${BRAND_VERSION}`;

// Icons for consistent messaging
const ICONS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  security: '🔒',
  testing: '🧪',
  web3: '🌐',
  loading: '⏳'
};

/**
 * Formatted success message
 * @param {string} message - Message to display
 * @returns {string} Formatted message
 */
function success(message) {
  return `${ICONS.success} ${chalk.hex(COLORS.success)(message)}`;
}

/**
 * Formatted warning message
 * @param {string} message - Message to display
 * @returns {string} Formatted message
 */
function warning(message) {
  return `${ICONS.warning} ${chalk.hex(COLORS.warning)(message)}`;
}

/**
 * Formatted error message
 * @param {string} message - Message to display
 * @returns {string} Formatted message
 */
function error(message) {
  return `${ICONS.error} ${chalk.hex(COLORS.error)(message)}`;
}

/**
 * Formatted info message
 * @param {string} message - Message to display
 * @returns {string} Formatted message
 */
function info(message) {
  return `${ICONS.info} ${chalk.hex(COLORS.info)(message)}`;
}

/**
 * Create a branded header for CLI sections
 * @param {string} title - Section title
 * @returns {string} Formatted section header
 */
function sectionHeader(title) {
  const separator = '─'.repeat(title.length + 4);
  return `
${chalk.hex(COLORS.primary)(separator)}
  ${chalk.hex(COLORS.primary).bold(title)}
${chalk.hex(COLORS.primary)(separator)}
`;
}

/**
 * Create a branded spinner with consistent styling
 * @param {string} text - Initial spinner text
 * @returns {object} Ora spinner instance
 */
function spinner(text) {
  return ora({
    text,
    color: 'blue',
    spinner: 'dots',
  });
}

/**
 * Format a command for display in help text
 * @param {string} command - Command name
 * @param {string} args - Command arguments
 * @param {string} description - Command description
 * @returns {string} Formatted command help
 */
function formatCommand(command, args = '', description = '') {
  const cmd = chalk.hex(COLORS.primary).bold(command);
  const arguments = chalk.hex(COLORS.gray)(args);
  
  return `  ${cmd} ${arguments}
    ${description}`;
}

/**
 * Display a branded welcome message
 */
function showWelcome() {
  console.log(`
${chalk.hex(COLORS.primary).bold('╭───────────────────────────────────────────────╮')}
${chalk.hex(COLORS.primary).bold('│')}        ${BRAND_HEADER}        ${chalk.hex(COLORS.primary).bold('│')}
${chalk.hex(COLORS.primary).bold('│')}  ${chalk.hex(COLORS.secondary)('Security Testing Toolkit for Web3')}   ${chalk.hex(COLORS.primary).bold('│')}
${chalk.hex(COLORS.primary).bold('╰───────────────────────────────────────────────╯')}
`);
}

/**
 * Format a progress bar
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {number} barLength - Length of the progress bar
 * @returns {string} Formatted progress bar
 */
function progressBar(current, total, barLength = 30) {
  const progress = Math.min(Math.floor((current / total) * barLength), barLength);
  const emptyProgress = barLength - progress;
  
  const progressText = '█'.repeat(progress);
  const emptyProgressText = '░'.repeat(emptyProgress);
  const percentage = Math.round((current / total) * 100);
  
  return `[${chalk.hex(COLORS.primary)(progressText)}${emptyProgressText}] ${percentage}%`;
}

module.exports = {
  COLORS,
  ICONS,
  BRAND_HEADER,
  success,
  warning,
  error,
  info,
  sectionHeader,
  spinner,
  formatCommand,
  showWelcome,
  progressBar
}; 