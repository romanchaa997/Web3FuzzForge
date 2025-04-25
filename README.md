# Web3FuzzForge Security Testing Kit

A comprehensive toolkit for testing Web3 dApps, focusing on security and functional testing.

📚 **[Full Documentation](https://docs.web3fuzzforge.dev)** - Visit our comprehensive documentation site for guides, tutorials, and reference materials.

## Documentation

The project documentation is built with Docusaurus and available at [docs.web3fuzzforge.dev](https://docs.web3fuzzforge.dev).

### Running the documentation locally

```bash
# On Windows
cd docs-site
npm install
npm start

# Deploy (Windows)
.\deploy-docs.ps1

# Deploy (macOS/Linux)
chmod +x deploy-docs.sh
./deploy-docs.sh
```

## Setup & Installation

### Local Installation (Recommended)

This project has a pre-packed `.tgz` file that you can install locally:

```bash
# Install dependencies
npm install

# Install the web3fuzzforge package locally
npm run local-install
```

### Alternative: Using Local Commands

If you encounter issues with the package installation, you can use these direct command alternatives:

```bash
# Generate a connection test
npm run forge:gen connect -- --wallet metamask --out ./tests/connection-test.js

# Run tests in mock mode
npm run forge:run -- --mock-mode --headed
```

## CLI Help Output

```
Usage: web3fuzzforge <command> [options]

Commands:
  generate       Generate test templates
  run            Run test suite
  doctor         Check environment setup
  snapshot       Create and manage wallet snapshots
  fuzz           Run fuzz testing on dApp
  help           Show help for a command

Options:
  -v, --version  Show version number
  -h, --help     Show help

Examples:
  web3fuzzforge generate connect --wallet metamask --out ./tests/connection.test.js
  web3fuzzforge run --mock-mode --headed
  web3fuzzforge doctor

For detailed documentation, visit: https://docs.web3fuzzforge.dev
```

## Usage

### Generate Test Templates

```