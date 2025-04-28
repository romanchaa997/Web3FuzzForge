# Contributing to Web3FuzzForge

Thank you for your interest in contributing to Web3FuzzForge! 

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with a detailed description including:

1. The steps to reproduce the bug
2. What you expected to happen
3. What actually happened
4. Your environment (Node.js version, browser, OS)

### Feature Requests

We welcome feature requests! Please create an issue describing:

1. The problem you're trying to solve
2. Your proposed solution
3. Any alternative solutions you've considered

### Pull Requests

We actively welcome pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests covering your changes
3. Ensure your code passes all tests and linting
4. Create a pull request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build the package: `npm run build`

## Adding a New Template

To add a new wallet template:

1. Create template files in `templates/providers/your-wallet-name/`
2. Add the wallet to the supported list in `src/index.js`
3. Create a test case in `tests/`
4. Update documentation to include your new wallet

## Adding a Security Test Case

1. Add your test case to `templates/security/`
2. Ensure it follows the vulnerability categorization in the docs
3. Add a sample test showing its usage

## Code Style

- Follow the existing code style (configured via ESLint and Prettier)
- Include JSDoc comments for public functions
- Keep template files clean and well-documented

## License

By contributing to Web3FuzzForge, you agree that your contributions will be licensed under the project's MIT license. 