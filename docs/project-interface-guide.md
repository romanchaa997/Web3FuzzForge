# Web3FuzzForge Interface Guide

This document provides a comprehensive guide to the Web3FuzzForge user interface and how to navigate the project effectively.

## Table of Contents

- [Overview](#overview)
- [Command Line Interface](#command-line-interface)
- [Web Interface](#web-interface)
- [Test Report Interface](#test-report-interface)
- [Integration with IDEs](#integration-with-ides)

## Overview

Web3FuzzForge provides multiple interfaces to accommodate different user preferences and workflows:

1. **Command Line Interface**: For developers who prefer terminal-based workflows
2. **Web Interface**: For visual test configuration and management
3. **Test Report Interface**: For reviewing and sharing test results
4. **IDE Extensions**: For integrated development experience

## Command Line Interface

### Basic Commands

```bash
# Generate a connection test
web3fuzzforge generate connect --wallet metamask --out ./tests/connection-test.js

# Generate a transaction test with fuzzing
web3fuzzforge generate tx --wallet metamask --out ./tests/security-tx-test.js --fuzz

# Run tests
web3fuzzforge run --headed

# Generate a security report
web3fuzzforge report
```

### Command Structure

All Web3FuzzForge commands follow this structure:

```
web3fuzzforge <command> [options]
```

Main commands:
- `generate`: Create new test files
- `run`: Execute tests
- `report`: Generate reports
- `wallet`: Manage wallet connections
- `config`: Configure tool settings

For detailed options, run:
```bash
web3fuzzforge <command> --help
```

## Web Interface

The Web Interface can be accessed by running:

```bash
npm run web-ui
```

### Interface Sections

1. **Dashboard**: Overview of recent tests and project status
2. **Test Generator**: Visual interface for creating tests
3. **Test Runner**: Execute and monitor tests
4. **Reports**: View and analyze test results
5. **Settings**: Configure project settings

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Generate Test |
| `Ctrl+R` | Run Tests |
| `Ctrl+D` | View Dashboard |
| `Ctrl+S` | Settings |
| `F1` | Help |

## Test Report Interface

Reports are generated in HTML format for easy viewing in any browser.

### Viewing Reports

```bash
npm run view:report
```

This opens the report in your default browser.

### Report Sections

1. **Summary**: Overall test results and metrics
2. **Test Cases**: Detailed results for each test
3. **Security Findings**: Vulnerability reports and severity ratings
4. **Screenshots**: Visual evidence of test execution
5. **Recommendations**: Suggested fixes for identified issues

## Integration with IDEs

### VS Code Extension

1. Install the extension from `extensions/vscode`
2. Access features from the Web3FuzzForge panel in VS Code
3. Right-click on test files to run or debug

### Commands in VS Code

- `Web3FuzzForge: Generate Test`: Create new test
- `Web3FuzzForge: Run Tests`: Execute tests
- `Web3FuzzForge: View Report`: Open report
- `Web3FuzzForge: Configure`: Open settings

## Tips for Efficient Navigation

1. **Use Tab Completion**: The CLI supports tab completion for commands and options
2. **Save Configurations**: Create preset configurations for frequent test scenarios
3. **Customize Reports**: Configure report output to focus on areas of interest
4. **Use Search**: All interfaces include search functionality for finding specific tests or results
5. **Keyboard Navigation**: Memorize keyboard shortcuts for faster workflow

## Next Steps

- Explore the [Sample Tests](../autotests/sample-tests/) directory for examples
- Review the [Vulnerability Guides](vulnerability-guides/) to understand security testing
- Check out [Demo dApp](../examples/demo-dapp/) for a complete testing example 