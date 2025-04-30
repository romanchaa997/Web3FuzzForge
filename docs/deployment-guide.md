# Deployment Guide for Web3FuzzForge

This guide provides detailed instructions for deploying Web3FuzzForge components to various environments.

## Overview

Web3FuzzForge has several components that can be deployed:

1. **NPM Package** - The core Web3FuzzForge package
2. **Documentation Site** - Docusaurus-based documentation
3. **Landing Page** - Project landing page
4. **Demo dApp** - Example application for testing

## Prerequisites

Before deployment, ensure you have:

- Node.js (v16.0.0 or higher, but less than v19)
- NPM (v7.0.0 or higher)
- GitHub account with repository access
- Netlify account (optional, for enhanced documentation hosting)
- Access to project GitHub repository

## Deployment Options

### 1. NPM Package Deployment

The Web3FuzzForge package can be published to NPM:

```bash
# Build the package
npm run build

# Publish to NPM
npm publish
# OR to publish a pre-release version
npm publish --tag next
```

**Automated deployment**: The release process is automated with GitHub Actions. Simply:

1. Tag your release commit with a version number (e.g., `v1.2.0`)
2. Push the tag to GitHub
3. The `release.yml` workflow will automatically:
   - Run tests
   - Build the package
   - Publish to NPM
   - Create a GitHub release

### 2. Documentation Site Deployment

The documentation is built with Docusaurus and can be deployed to:

#### Option A: GitHub Pages (Default)

The deployment happens automatically when changes are pushed to the main branch.

To deploy manually:

```bash
# Build the docs
cd docs-site
npm run build

# Deploy (if you need to do it manually)
npm run deploy
```

#### Option B: Netlify Deployment

1. Connect your Netlify account to GitHub
2. Create a new site from the repository
3. Configure build settings:
   - Build command: `cd docs-site && npm install && npm run build`
   - Publish directory: `docs-site/build`
4. Add environment variables in Netlify settings if needed

**Custom Domain**: To set up a custom domain:

1. Go to Netlify site settings → Domain management
2. Add a custom domain and follow the DNS configuration steps

### 3. Landing Page Deployment

The landing page is deployed to GitHub Pages through the GitHub Actions workflow:

1. Changes to `index.html` or `assets/` will trigger deployment
2. The `gh-pages.yml` workflow builds and deploys the site

To manually deploy the landing page:

```bash
# Install gh-pages tool
npm install -g gh-pages

# Deploy the landing page
gh-pages -d . --include="index.html,assets/**/*"
```

### 4. Demo dApp Deployment

To deploy the demonstration dApp:

```bash
# Navigate to the demo-dapp directory
cd examples/demo-dapp

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting service of choice
# For example, using Netlify CLI:
netlify deploy --prod
```

## Environment Configuration

Create a `.env` file based on the `.env-example` template:

```
# Copy the example environment file
cp .env-example .env

# Edit with your specific settings
nano .env
```

Required environment variables:

- `GITHUB_TOKEN` (for GitHub API access)
- `NPM_TOKEN` (for NPM publishing)

## Deployment Checklist

Before deploying a new version:

1. ✅ Run all tests (`npm test`)
2. ✅ Check for security vulnerabilities (`npm run security:scan`)
3. ✅ Update version in `package.json`
4. ✅ Update CHANGELOG.md
5. ✅ Build the package locally to ensure it works
6. ✅ Verify documentation is up-to-date with latest features

## Monitoring and Maintenance

After deployment:

1. Verify the documentation site works correctly
2. Check that all links in the documentation work
3. Run a sample installation of the package to confirm it works
4. Monitor GitHub issues for potential problems

## Troubleshooting

Common deployment issues:

| Issue | Solution |
|-------|----------|
| NPM publish fails | Check NPM token permissions and package version |
| GitHub Pages deployment fails | Check repository settings and workflow permissions |
| Documentation broken links | Run `npm run build` in docs-site and check for errors |
| Missing assets | Ensure all assets are included in the deployment |

## Rollback Procedure

If a deployment causes issues:

1. For NPM packages:
   ```bash
   npm deprecate web3fuzzforge@"version-with-issues" "Critical issues found, please update"
   ```

2. For documentation or landing page:
   - Revert the commit and push to main
   - OR manually trigger the workflow with a previous commit

## Contact for Support

If you encounter deployment issues, contact:
- Repository maintainers via GitHub issues
- Join our Discord server for real-time support 