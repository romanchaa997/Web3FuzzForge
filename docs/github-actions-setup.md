# GitHub Actions Setup Guide

This guide explains how to correctly set up GitHub Actions for the Web3FuzzForge project.

## Available Workflows

Our repository includes the following GitHub Actions workflows:

1. **Deploy Landing Page** (`gh-pages.yml`) - Deploys the main landing page to GitHub Pages
2. **Documentation Deployment** (`docs-deployment.yml`) - Builds and deploys the Docusaurus documentation site
3. **Security Scan** (`security-scan.yml`) - Performs security vulnerability checks on dependencies and code
4. **Release Workflow** (`release.yml`) - Creates and publishes releases for the project
5. **Playwright Tests** (`playwright.yml`) - Runs automated tests using Playwright
6. **Linting** (`lint.yml`) - Performs code quality checks
7. **Performance Tests** (`performance.yml`) - Runs performance benchmarks

## Setting Up Secrets

To ensure workflows run correctly, you need to set up the following repository secrets:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `GITHUB_TOKEN` | Automatically provided by GitHub | All workflows |
| `NPM_TOKEN` | NPM access token for publishing packages | Release workflow |
| `SNYK_TOKEN` | API token for Snyk security scanning | Security scan workflow |
| `NETLIFY_AUTH_TOKEN` | Netlify authentication token | Documentation deployment |
| `NETLIFY_SITE_ID` | ID of your Netlify site | Documentation deployment |

## Configuring GitHub Pages

For the documentation and landing page to deploy correctly:

1. Go to repository Settings → Pages
2. Under "Build and deployment" → "Source", select "GitHub Actions"
3. Make sure your repository has proper permissions set up:
   - Go to Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"

## Custom Configuration

You can customize the workflow behavior by modifying the following files:

- `.github/workflows/*.yml` - The workflow definitions
- `.env-example` - Example environment variables (copy to `.env` for local development)
- `playwright.config.js` - Playwright test configuration

## Workflow Triggers

Our workflows are triggered by:

1. **Push to main/master branch**
   - Documentation updates
   - Landing page changes
   - Security scanning

2. **Pull Requests**
   - Automated testing
   - Linting checks

3. **Scheduled runs**
   - Daily security scans (security-scan.yml runs daily at midnight)

4. **Manual triggers**
   - All workflows can be run manually using the "workflow_dispatch" event

## Deployment Process

When changes are pushed to the main branch:

1. The linting workflow verifies code quality
2. If tests pass, the documentation site gets deployed to GitHub Pages
3. Security scans run to detect vulnerabilities
4. For releases, tag your commit with a version number (e.g., v1.2.0) to trigger the release workflow

## Troubleshooting

If you encounter issues with GitHub Actions:

1. Check the workflow run logs in the "Actions" tab of your repository
2. Verify that all required secrets are properly set
3. Ensure your repository has the correct permissions
4. Check that your branch names match the trigger conditions in workflows

For more help, refer to the [GitHub Actions documentation](https://docs.github.com/en/actions).

## Next Steps for Improvement

To enhance the CI/CD pipeline:

1. Add performance benchmark comparisons between runs
2. Implement code coverage reports
3. Add automated visual regression testing
4. Create workflows for specific environments (staging, production)
5. Implement dependency update automation 

name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
          retention-days: 7 