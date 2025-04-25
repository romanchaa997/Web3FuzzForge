#!/bin/bash

# Simple script to build and deploy the docs site

# Ensure we have the latest dependencies
npm install

# Build the site
npm run build

# If using GitHub Pages (automatically deploys from ./build to gh-pages branch)
GIT_USER=$(git config user.name) \
CURRENT_BRANCH=main \
USE_SSH=true \
npm run deploy

echo "Deployment complete! Your site should be available at https://docs.web3fuzzforge.dev soon."
echo ""
echo "If you're using GitHub Pages with a custom domain, ensure your CNAME file is configured correctly." 