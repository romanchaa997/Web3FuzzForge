#!/usr/bin/env node

/**
 * Package Security Update Script
 * 
 * This script updates package.json and runs security fixes.
 * Run with: node package-security-update.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log a message with color
 */
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Run a command and return its output
 */
function runCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, COLORS.blue);
    const output = execSync(command, { encoding: 'utf8', ...options });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout,
      statusCode: error.status 
    };
  }
}

/**
 * Update package.json fields
 */
function updatePackageJson() {
  log('Updating package.json...', COLORS.blue);
  
  const packagePath = path.join(__dirname, 'package.json');
  
  // Read the current package.json
  let packageData;
  try {
    packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    log(`Error reading package.json: ${error.message}`, COLORS.red);
    return false;
  }
  
  // Make updates to package.json
  
  // Pin dependency versions (remove ^ and ~)
  Object.keys(packageData.dependencies || {}).forEach(key => {
    const version = packageData.dependencies[key];
    if (typeof version === 'string' && (version.startsWith('^') || version.startsWith('~'))) {
      packageData.dependencies[key] = version.substring(1);
    }
  });
  
  Object.keys(packageData.devDependencies || {}).forEach(key => {
    const version = packageData.devDependencies[key];
    if (typeof version === 'string' && (version.startsWith('^') || version.startsWith('~'))) {
      packageData.devDependencies[key] = version.substring(1);
    }
  });
  
  // Add or update engines field
  packageData.engines = packageData.engines || {};
  packageData.engines.node = packageData.engines.node || '>=16.0.0 <19.0.0';
  packageData.engines.npm = packageData.engines.npm || '>=7.0.0';
  
  // Add engineStrict
  packageData.engineStrict = true;
  
  // Add resolutions for problematic dependencies
  packageData.resolutions = packageData.resolutions || {};
  packageData.resolutions['minimatch'] = '^5.1.6';
  packageData.resolutions['path-to-regexp'] = '^6.2.1';
  packageData.resolutions['serve-handler/minimatch'] = '^5.1.6';
  
  // Add security scripts
  packageData.scripts = packageData.scripts || {};
  packageData.scripts['security:fix'] = 'node utils/dependency-check.js';
  packageData.scripts['audit:fix'] = 'npm audit fix --force || echo \'Manual review required for remaining vulnerabilities\'';
  
  // Write the updated package.json
  try {
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
    log('✅ Updated package.json successfully', COLORS.green);
    return true;
  } catch (error) {
    log(`Error writing package.json: ${error.message}`, COLORS.red);
    return false;
  }
}

/**
 * Create utils directory if it doesn't exist
 */
function ensureUtilsDirectory() {
  const utilsDir = path.join(__dirname, 'utils');
  if (!fs.existsSync(utilsDir)) {
    log('Creating utils directory...', COLORS.blue);
    fs.mkdirSync(utilsDir, { recursive: true });
    log('✅ Created utils directory', COLORS.green);
  }
}

/**
 * Main function
 */
async function main() {
  log('\n🔒 Web3FuzzForge Security Update Script 🔒\n', COLORS.magenta);
  
  // Ensure utils directory exists
  ensureUtilsDirectory();
  
  // Update package.json
  if (!updatePackageJson()) {
    process.exit(1);
  }
  
  // Install dependencies
  log('\nInstalling dependencies...', COLORS.blue);
  const installResult = runCommand('npm install');
  if (!installResult.success) {
    log(`Error installing dependencies: ${installResult.error}`, COLORS.red);
    log('Please run npm install manually to continue.', COLORS.yellow);
  } else {
    log('✅ Dependencies installed successfully', COLORS.green);
  }
  
  // Run dependency check script
  log('\nRunning dependency check...', COLORS.blue);
  const checkResult = runCommand('node utils/dependency-check.js');
  if (!checkResult.success) {
    log(`Warning: Dependency check exited with issues: ${checkResult.error}`, COLORS.yellow);
  } else {
    log('✅ Dependency check completed', COLORS.green);
  }
  
  log('\n🎉 Security updates completed! 🎉\n', COLORS.magenta);
  
  log('Next steps:', COLORS.cyan);
  log('1. Review the changes in package.json', COLORS.cyan);
  log('2. Update imports in your tests to use the dappeteer-wrapper:', COLORS.cyan);
  log('   const dappeteer = require(\'../src/utils/dappeteer-wrapper\');', COLORS.cyan);
  log('3. Run security checks periodically with: npm run security:fix', COLORS.cyan);
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, COLORS.red);
  process.exit(1);
}); 