#!/bin/bash

# Web3 Security Test Kit Setup Script
# This script sets up the environment and installs all required dependencies

set -e # Exit on error

echo "🔧 Setting up Web3 Security Test Kit..."

# Install Node modules
echo "📦 Installing Node dependencies..."
npm ci

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Run security checks
echo "🔒 Running security checks..."
node utils/dependency-check.js

echo "✅ Setup complete! You can now run tests with:"
echo "   npm test"
echo ""
echo "💡 For a headed test example, try:"
echo "   npx playwright test tests/sample-custom-wallet-connect.test.js --headed" 