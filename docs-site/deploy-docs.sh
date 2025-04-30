#!/bin/bash

# Web3FuzzForge Documentation Deployment Script
# This script builds and deploys the documentation site

set -e

# Define color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Web3FuzzForge documentation deployment...${NC}"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git and try again.${NC}"
    exit 1
fi

# Check if user is logged in to Git
if [ -z "$(git config --get user.name)" ]; then
    echo -e "${RED}Error: Git user name not set. Please configure Git and try again.${NC}"
    echo "Run: git config --global user.name \"Your Name\""
    echo "Run: git config --global user.email \"your.email@example.com\""
    exit 1
fi

# Build the documentation site
echo -e "${YELLOW}Building documentation site...${NC}"
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo -e "${RED}Error: Build failed. Please check for errors and try again.${NC}"
    exit 1
fi

# Prepare for deployment
echo -e "${YELLOW}Preparing for deployment...${NC}"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "Current branch: ${GREEN}${CURRENT_BRANCH}${NC}"

# Ask for confirmation
read -p "Deploy documentation from branch '${CURRENT_BRANCH}' to GitHub Pages? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Deploy to GitHub Pages
echo -e "${YELLOW}Deploying to GitHub Pages...${NC}"

# Use the correct environment variables based on SSH or HTTPS
if [ -n "$(git remote get-url origin | grep 'git@github.com')" ]; then
    echo -e "Using SSH for deployment..."
    USE_SSH=true
else
    echo -e "Using HTTPS for deployment..."
    USE_SSH=false
    
    # Prompt for GitHub token if needed
    if [ -z "$GIT_USER" ]; then
        read -p "Enter your GitHub username: " GIT_USER
        export GIT_USER=$GIT_USER
    fi
fi

# Run the deploy command
if [ "$USE_SSH" = true ]; then
    GIT_USER="" CURRENT_BRANCH=$CURRENT_BRANCH USE_SSH=true npm run deploy
else
    CURRENT_BRANCH=$CURRENT_BRANCH USE_SSH=false npm run deploy
fi

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Documentation successfully deployed to GitHub Pages!${NC}"
    echo -e "Visit: https://$(git config --get remote.origin.url | cut -d/ -f4-5 | cut -d. -f1).github.io/web3-security-test-kit/"
else
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment process complete!${NC}" 