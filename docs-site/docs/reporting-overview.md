---
sidebar_position: 1
---

# Test Result Reporting

Web3FuzzForge provides a structured reporting system to help you analyze test results, particularly security vulnerabilities found during testing.

## Current Reporting System

The current reporting system includes:

- Detailed test logs in the `test-results/` directory
- Visual report generation with Playwright's built-in HTML reporter
- Basic failure categorization

## Accessing Test Reports

After running your tests, you can access reports in several ways:

```bash
# Open the HTML report from your last test run
npx playwright show-report

# Specify a custom report location
npx playwright test --reporter=html:./custom-report-path
```

## Report Structure

The HTML report includes:

- Test case summary with pass/fail status
- Step-by-step execution logs
- Screenshots of failure points
- Execution time metrics
- Environment information

## Customizing Reports

You can customize the reports by:

1. Modifying your `playwright.config.js` file:

```javascript
module.exports = {
  reporter: [
    ['html', { outputFolder: 'test-reports' }],
    ['json', { outputFile: 'results.json' }],
  ],
  // ...other configuration
};
```

2. Adding custom metadata to reports:

```javascript
test('Connection test with custom metadata', async ({ page }, testInfo) => {
  // Add custom testing metadata
  testInfo.annotations.push({
    type: 'wallet',
    description: 'MetaMask',
  });

  testInfo.annotations.push({
    type: 'test_category',
    description: 'security',
  });

  // Run your test...
});
```

## Future Improvements

Based on community feedback, we plan to enhance the reporting system with:

1. **Vulnerability Categorization**: Standardized categorization of security issues using OWASP Top 10 for Web3
2. **Severity Rankings**: Clear indication of the severity level of each vulnerability
3. **Risk Assessment**: Context-aware risk analysis for each vulnerability
4. **Recommendations**: Automated suggestions for fixing identified issues
5. **Export Options**: Additional report formats (PDF, CSV, JSON) for integration with other tools
6. **Trending Analysis**: Track vulnerability patterns across test runs
7. **Collaborative Annotations**: Allow teams to comment and collaborate on results

## Contributing to Reporting Improvements

We welcome community contributions to our reporting system. See the [vulnerability-categorization](vulnerability-categorization) page for details on how to help standardize Web3 security vulnerability classifications.
