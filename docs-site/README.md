# Web3FuzzForge Documentation Site

This directory contains the Docusaurus-based documentation site for Web3FuzzForge.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm start
```

This will start a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

## Building for Production

```bash
# Build the site
npm run build

# Test the build locally
npm run serve
```

This command generates static content in the `build` directory that can be served using any static content hosting service.

## Deployment

```bash
# Easy deployment script
./deploy-docs.sh
```

Or manually:

```bash
GIT_USER=<Your GitHub username> \
CURRENT_BRANCH=main \
USE_SSH=true \
npm run deploy
```

This command is a convenient way to build the website and push to the `gh-pages` branch.

## Documentation Structure

- **Getting Started**: overview, why-it-matters, installation, quickstart
- **Reference**: commands-reference, advanced-guides
- **Wallet Integration**: real-wallet-integration, mobile-wallets, wallet-state-snapshots
- **Advanced Testing**: cross-chain-testing, security-testing
- **Reporting**: reporting-overview, vulnerability-categorization
- **Community**: community-test-examples

## Adding New Documentation

1. Create new `.md` files in the `docs` directory
2. Update `sidebars.js` to include your new document
3. Link to your document from other relevant pages

## Contributing to Documentation

1. Create a new Markdown file in the `docs` directory
2. Add the frontmatter with `sidebar_position` to control the order
3. Update the `sidebars.js` file if adding a new section
4. Submit a pull request with your changes

## Customizing the Site

- Edit `docusaurus.config.js` to modify site configuration
- Customize styling in `src/css/custom.css`
- Modify the landing page in `src/pages/index.js`

## Documentation Standards

- Use clear, concise language
- Include code examples where appropriate
- Add cross-references to related documentation
- Use proper Markdown formatting
- Include images and diagrams when helpful
