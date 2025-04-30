---
id: reporting-overview
title: Test Result Reporting
sidebar_label: Reporting
slug: /reporting-overview
---

# Test Result Reporting

Web3FuzzForge provides a comprehensive reporting system to help you analyze test results, identify security vulnerabilities, and track improvements over time.

## Enhanced Reporting System

Our updated reporting system includes:

- **Structured Test Reports**: JSON and HTML formats with detailed vulnerability information
- **Vulnerability Categorization**: Based on standardized Web3 security classifications
- **Severity Ratings**: CVSS-compatible severity scores for each finding
- **CI/CD Integration**: Seamless integration with popular CI/CD systems
- **Trend Analysis**: Track security posture improvements over time

## Accessing Test Reports

After running your tests, you can access reports in several ways:

```bash
# Generate a comprehensive security report
web3fuzzforge run --report-format=full

# Open the HTML report from your last test run
web3fuzzforge report open

# Export report to different formats
web3fuzzforge report export --format=json|csv|pdf
```

## Vulnerability Categorization

All security findings are automatically categorized using our standardized Web3 vulnerability classification system:

| Category | Description | Examples |
|----------|-------------|----------|
| **W01: Authentication** | Issues with wallet connection and authentication | Insecure signature requests, phishing-vulnerable prompts |
| **W02: Authorization** | Permission and access control issues | Unlimited token approvals, missing permission checks |
| **W03: Transaction Integrity** | Problems with transaction construction or validation | Malformed transaction inputs, missing validation |
| **W04: State Management** | Issues with wallet or dApp state handling | Race conditions, stale state after network switching |
| **W05: Error Handling** | Improper handling of errors or exceptions | Unhandled promise rejections, silent failures |
| **W06: User Interface** | Misleading or vulnerable UI elements | Deceptive transaction information, poor security warnings |

## Severity Ratings

Each vulnerability is assigned a severity rating:

- **Critical**: Immediate exploitation risk with severe consequences
- **High**: Significant security impact with straightforward exploitation
- **Medium**: Notable security issues requiring specific conditions to exploit
- **Low**: Minor issues with limited security impact
- **Informational**: Best practice recommendations

## Integration with CI/CD

Integrate security reporting into your development workflows:

```yaml
# Example GitHub Actions configuration
name: Web3 Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        
      - name: Run security tests
        run: web3fuzzforge run --ci --report-format=github
```

## Customizing Reports

You can customize the reports by modifying your `.web3fuzzforge.json` configuration:

```json
{
  "reporting": {
    "outputDir": "./security-reports",
    "formats": ["html", "json", "github"],
    "categorization": true,
    "screenshots": true,
    "evidenceCollection": true,
    "remediation": true
  }
}
```

## Creating Custom Report Templates

Define your own report templates for organization-specific requirements:

```javascript
// custom-template.js
module.exports = {
  name: 'Company Security Template',
  formatResult: (testResults) => {
    // Custom formatting logic
    return {
      companyId: process.env.COMPANY_ID,
      projectName: process.env.PROJECT_NAME,
      timestamp: new Date().toISOString(),
      results: testResults,
      summary: generateSummary(testResults)
    };
  }
};
```

## Viewing Report Examples

To see sample reports, run:

```bash
web3fuzzforge demo-report
```

This will generate example reports demonstrating the various formats and information provided by the reporting system.
