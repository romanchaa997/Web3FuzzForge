---
sidebar_position: 4
---

# Commands Reference

This page documents all available Web3FuzzForge CLI commands and their options.

## Global Commands

### `help`

Display help information for any command.

```bash
npx web3fuzzforge help
npx web3fuzzforge help generate
```

### `doctor`

Verify your environment setup is correct.

```bash
npx web3fuzzforge doctor
```

The doctor command checks:
- Configuration file existence and validity
- Required environment variables
- Dependency installation status
- Template file availability
- Browser installation for Playwright

## Test Generation Commands

### `generate`

Generate test templates with various options.

```bash
npx web3fuzzforge generate <type> [options]
```

#### Types

- `connect` - Generate wallet connection tests
- `tx` - Generate transaction tests
- `sign` - Generate signature tests
- `custom` - Generate custom test templates

#### Common Options

- `--wallet <name>` - Specify wallet type (metamask, coinbase, phantom, etc.)
- `--out <path>` - Output file path
- `--typescript` - Generate TypeScript instead of JavaScript
- `--preset <name>` - Use a predefined configuration preset
- `--fuzz` - Add fuzzing capabilities to generated tests
- `--self-contained` - Generate tests without external dependencies

### `run`

Run generated tests with various options.

```bash
npx web3fuzzforge run [options]
```

#### Options

- `--mock-mode` - Run with mocked wallet implementations
- `--headed` - Run tests in headed mode (showing browser UI)
- `--target-url=<url>` - Specify the target dApp URL
- `--report` - Generate a detailed test report
- `--workers=<number>` - Specify number of parallel test workers

## Configuration Commands

### `init`

Initialize a new configuration file for your project.

```bash
npx web3fuzzforge init
```

### `config`

View or edit configuration settings.

```bash
npx web3fuzzforge config list
npx web3fuzzforge config set <key> <value>
```

## Advanced Commands

### `snapshot`

Create and manage wallet state snapshots.

```bash
npx web3fuzzforge snapshot create
npx web3fuzzforge snapshot list
npx web3fuzzforge snapshot use <name>
```

### `report`

Generate and manage test reports.

```bash
npx web3fuzzforge report generate
npx web3fuzzforge report open
```

### `fuzz`

Run fuzz testing on your dApp.

```bash
npx web3fuzzforge fuzz --target-url=<url> --wallet <type>
``` 