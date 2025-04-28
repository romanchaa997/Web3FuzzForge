# Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using Web3FuzzForge.

## Configuration Issues

### Missing Configuration File

**Problem:** Error message about missing `.web3fuzzforge.json` file.

**Solution:**
```bash
npx web3fuzzforge init --interactive
```

This will create a configuration file with guided setup, detecting your project type automatically.

### Invalid Configuration Format

**Problem:** JSON syntax errors in your configuration file.

**Solution:**
```bash
npx web3fuzzforge validate
```

This command will identify specific issues in your configuration file.

## Environment Setup Issues

### Browser Launch Failures

**Problem:** Tests fail to launch browsers or connect to wallets.

**Solution:**
```bash
npx playwright install
```

This installs all required browsers for testing. Make sure you have system dependencies like X11 or Wayland on Linux.

### Missing Dependencies

**Problem:** Error messages about missing Node.js modules.

**Solution:**
```bash
npm install
```

If the issue persists, check your Node.js version:
```bash
node --version
```

Web3FuzzForge requires Node.js v16 or higher.

## Wallet Connection Issues

### Failed to Connect to Wallet

**Problem:** Tests can't connect to your browser wallet extension.

**Solutions:**

1. Make sure your wallet extension is properly installed and enabled
2. Verify the wallet is unlocked before running tests
3. Check your configuration for the correct wallet type:

```json
{
  "wallet": "metamask"  // Options: metamask, coinbase, walletconnect, phantom, rabby
}
```

4. Try running in mock mode for testing without real wallets:
```bash
npx web3fuzzforge run --mock-mode
```

### Selector Not Found

**Problem:** Cannot find wallet connect button on the page.

**Solution:**

1. Update your configuration with the correct selector:
```json
{
  "connect_button_selector": ".your-actual-button-selector"
}
```

2. Use browser developer tools to verify the selector
3. Run with `--debug` flag to see the page state:
```bash
npx web3fuzzforge run --debug
```

## Performance Issues

### Tests Running Too Slowly

**Problem:** Tests take too long to complete.

**Solutions:**

1. Use mock mode for faster testing:
```bash
npx web3fuzzforge run --mock-mode
```

2. Reduce the number of tests by using specific test patterns:
```bash
npx web3fuzzforge run --grep "connection"
```

3. Run tests in parallel by adjusting worker count:
```bash
npx web3fuzzforge run --workers=4
```

## Permission Issues

### Permission Denied Errors

**Problem:** File system permission errors.

**Solutions:**

1. Make sure you have write permissions to the output directory
2. On Unix-like systems, you may need to run with sudo for global installations
3. Check if antivirus software is blocking file access

## Network Issues

### Connection Refused Errors

**Problem:** Can't connect to the target dApp.

**Solutions:**

1. Verify the URL in your configuration file
2. Check your internet connection and firewall settings
3. Make sure the target site is operational
4. Use mock mode if testing without a live dApp

## Report Issues & Get Help

If you encounter issues not covered in this guide:

1. Check the [GitHub repository](https://github.com/your-repo/web3fuzzforge/issues) for similar issues
2. Enable debug mode for more detailed logs:
```bash
DEBUG=1 npx web3fuzzforge run
```
3. Submit a detailed bug report with:
   - Your configuration file (redacted if needed)
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node.js version, etc.) 