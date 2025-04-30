#!/usr/bin/env node

/**
 * Web3FuzzForge Security Report Generator
 * 
 * This script generates structured security reports with vulnerability categorization based on test results.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');

// Vulnerability categories based on our defined taxonomy
const VULNERABILITY_CATEGORIES = {
  'W01': {
    name: 'Authentication',
    description: 'Issues with wallet connection and authentication',
    examples: ['Insecure signature requests', 'Phishing-vulnerable prompts']
  },
  'W02': {
    name: 'Authorization',
    description: 'Permission and access control issues',
    examples: ['Unlimited token approvals', 'Missing permission checks']
  },
  'W03': {
    name: 'Transaction Integrity',
    description: 'Problems with transaction construction or validation',
    examples: ['Malformed transaction inputs', 'Missing validation']
  },
  'W04': {
    name: 'State Management',
    description: 'Issues with wallet or dApp state handling',
    examples: ['Race conditions', 'Stale state after network switching']
  },
  'W05': {
    name: 'Error Handling',
    description: 'Improper handling of errors or exceptions',
    examples: ['Unhandled promise rejections', 'Silent failures']
  },
  'W06': {
    name: 'User Interface',
    description: 'Misleading or vulnerable UI elements',
    examples: ['Deceptive transaction information', 'Poor security warnings']
  }
};

// Severity levels
const SEVERITY_LEVELS = {
  'CRITICAL': {
    value: 4,
    description: 'Immediate exploitation risk with severe consequences',
    color: '#FF0000' // Red
  },
  'HIGH': {
    value: 3,
    description: 'Significant security impact with straightforward exploitation',
    color: '#FF8800' // Orange
  },
  'MEDIUM': {
    value: 2,
    description: 'Notable security issues requiring specific conditions to exploit',
    color: '#FFCC00' // Yellow
  },
  'LOW': {
    value: 1,
    description: 'Minor issues with limited security impact',
    color: '#00CC00' // Green
  },
  'INFO': {
    value: 0,
    description: 'Best practice recommendations',
    color: '#0088FF' // Blue
  }
};

/**
 * Configures the command line options
 */
function configureCommandLine() {
  program
    .name('generate-report')
    .description('Generate structured security reports from test results')
    .option('-i, --input <directory>', 'Directory containing test results', './test-results')
    .option('-o, --output <directory>', 'Output directory for reports', './security-reports')
    .option('-f, --format <formats>', 'Report formats (comma-separated: html,json,pdf)', 'html,json')
    .option('-p, --project <name>', 'Project name', 'Web3 dApp')
    .option('-v, --verbose', 'Verbose output')
    .option('--ci', 'Run in CI mode (non-interactive)')
    .parse(process.argv);

  return program.opts();
}

/**
 * Main function
 */
async function main() {
  const options = configureCommandLine();
  
  console.log(chalk.blue('Generating security report...'));
  
  // Ensure directories exist
  fs.ensureDirSync(options.input);
  fs.ensureDirSync(options.output);
  
  // Read test results
  const testResults = await loadTestResults(options.input);
  
  if (testResults.length === 0) {
    console.log(chalk.yellow('No test results found. Run tests before generating reports.'));
    process.exit(0);
  }
  
  // Process and categorize findings
  const findings = categorizeFindings(testResults);
  
  // Generate reports in requested formats
  const formats = options.format.split(',');
  
  for (const format of formats) {
    switch (format.trim().toLowerCase()) {
      case 'html':
        await generateHtmlReport(findings, options);
        break;
      case 'json':
        await generateJsonReport(findings, options);
        break;
      case 'pdf':
        await generatePdfReport(findings, options);
        break;
      default:
        console.log(chalk.yellow(`Unknown format: ${format}`));
    }
  }
  
  // Generate summary
  generateSummary(findings, options);
  
  console.log(chalk.green('Report generation complete!'));
}

/**
 * Load test results from the specified directory
 */
async function loadTestResults(directory) {
  const results = [];
  
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(directory, file);
        const content = await fs.readFile(filePath, 'utf8');
        try {
          const result = JSON.parse(content);
          results.push(result);
        } catch (error) {
          console.error(chalk.red(`Error parsing ${file}: ${error.message}`));
        }
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error reading directory ${directory}: ${error.message}`));
  }
  
  return results;
}

/**
 * Categorize findings from test results based on vulnerability patterns
 */
function categorizeFindings(testResults) {
  const findings = [];
  
  // Process each test result
  testResults.forEach(result => {
    if (!result.suites) return;
    
    processTestSuite(result.suites, findings);
  });
  
  // Sort findings by severity (highest first)
  findings.sort((a, b) => SEVERITY_LEVELS[b.severity].value - SEVERITY_LEVELS[a.severity].value);
  
  return findings;
}

/**
 * Process test suites recursively
 */
function processTestSuite(suites, findings) {
  suites.forEach(suite => {
    // Process nested suites
    if (suite.suites && suite.suites.length > 0) {
      processTestSuite(suite.suites, findings);
    }
    
    // Process tests in this suite
    if (suite.tests && suite.tests.length > 0) {
      suite.tests.forEach(test => {
        if (test.status === 'failed' || 
            (test.annotations && test.annotations.some(a => a.type === 'security_finding'))) {
          const finding = processTestFinding(test, suite);
          if (finding) {
            findings.push(finding);
          }
        }
      });
    }
  });
}

/**
 * Process a single test finding
 */
function processTestFinding(test, suite) {
  // Skip if no error or message
  if (!test.error && !test.annotations) return null;
  
  // Default finding data
  let finding = {
    id: generateFindingId(),
    title: test.title,
    description: test.error ? test.error.message : '',
    severity: 'MEDIUM', // Default severity
    category: 'W03', // Default category (Transaction Integrity)
    evidence: test.attachments || [],
    steps_to_reproduce: test.steps || [],
    suite: suite.title,
    test: test.title,
    timestamp: new Date().toISOString()
  };
  
  // Extract annotations if available
  if (test.annotations && test.annotations.length > 0) {
    test.annotations.forEach(annotation => {
      if (annotation.type === 'severity') {
        finding.severity = annotation.description.toUpperCase();
      } else if (annotation.type === 'category') {
        finding.category = annotation.description;
      } else if (annotation.type === 'description') {
        finding.description = annotation.description;
      } else if (annotation.type === 'remediation') {
        finding.remediation = annotation.description;
      }
    });
  }
  
  // Analyze error message and categorize finding if not already categorized
  if (test.error && !finding.category) {
    finding = categorizeFindingByError(finding, test.error);
  }
  
  // Add category details
  if (VULNERABILITY_CATEGORIES[finding.category]) {
    const category = VULNERABILITY_CATEGORIES[finding.category];
    finding.categoryName = category.name;
    finding.categoryDescription = category.description;
  }
  
  return finding;
}

/**
 * Categorize a finding based on error message patterns
 */
function categorizeFindingByError(finding, error) {
  const errorMsg = error.message.toLowerCase();
  
  // Authentication issues
  if (errorMsg.includes('signature') || errorMsg.includes('connect') || 
      errorMsg.includes('authentication') || errorMsg.includes('login')) {
    finding.category = 'W01';
    if (!finding.remediation) {
      finding.remediation = 'Implement secure wallet authentication practices, including clear user prompts and proper signature request validation.';
    }
  }
  // Authorization issues
  else if (errorMsg.includes('approve') || errorMsg.includes('permission') || 
           errorMsg.includes('authorization') || errorMsg.includes('allowance')) {
    finding.category = 'W02';
    if (!finding.remediation) {
      finding.remediation = 'Implement proper authorization checks and use specific, limited token approvals instead of unlimited approvals.';
    }
  }
  // Transaction integrity issues
  else if (errorMsg.includes('transaction') || errorMsg.includes('malformed') || 
           errorMsg.includes('input') || errorMsg.includes('validation')) {
    finding.category = 'W03';
    if (!finding.remediation) {
      finding.remediation = 'Implement robust input validation and transaction verification before submission.';
    }
  }
  // State management issues
  else if (errorMsg.includes('state') || errorMsg.includes('race condition') || 
           errorMsg.includes('network') || errorMsg.includes('switching')) {
    finding.category = 'W04';
    if (!finding.remediation) {
      finding.remediation = 'Implement proper state management, handle network switches gracefully, and prevent race conditions.';
    }
  }
  // Error handling issues
  else if (errorMsg.includes('error') || errorMsg.includes('exception') || 
           errorMsg.includes('unhandled') || errorMsg.includes('rejected')) {
    finding.category = 'W05';
    if (!finding.remediation) {
      finding.remediation = 'Implement comprehensive error handling and provide clear error messages to users.';
    }
  }
  // UI issues
  else if (errorMsg.includes('display') || errorMsg.includes('ui') || 
           errorMsg.includes('interface') || errorMsg.includes('warning')) {
    finding.category = 'W06';
    if (!finding.remediation) {
      finding.remediation = 'Improve user interface clarity, provide explicit security warnings, and ensure transaction details are clearly presented.';
    }
  }
  
  // Add severity based on error patterns if not already specified
  if (errorMsg.includes('critical') || errorMsg.includes('severe') || 
      errorMsg.includes('exploit') || errorMsg.includes('compromise')) {
    finding.severity = 'CRITICAL';
  } else if (errorMsg.includes('high') || errorMsg.includes('significant') || 
             errorMsg.includes('important')) {
    finding.severity = 'HIGH';
  } else if (errorMsg.includes('medium') || errorMsg.includes('moderate')) {
    finding.severity = 'MEDIUM';
  } else if (errorMsg.includes('low') || errorMsg.includes('minor')) {
    finding.severity = 'LOW';
  } else if (errorMsg.includes('info') || errorMsg.includes('recommendation')) {
    finding.severity = 'INFO';
  }
  
  return finding;
}

/**
 * Generate a unique finding ID
 */
function generateFindingId() {
  return `WFF-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
}

/**
 * Generate HTML report
 */
async function generateHtmlReport(findings, options) {
  console.log(chalk.blue('Generating HTML report...'));
  
  const reportDate = new Date().toLocaleDateString();
  const reportTime = new Date().toLocaleTimeString();
  
  // Count findings by severity
  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0
  };
  
  findings.forEach(finding => {
    if (severityCounts[finding.severity] !== undefined) {
      severityCounts[finding.severity]++;
    }
  });
  
  // Count findings by category
  const categoryCounts = {};
  Object.keys(VULNERABILITY_CATEGORIES).forEach(key => {
    categoryCounts[key] = 0;
  });
  
  findings.forEach(finding => {
    if (categoryCounts[finding.category] !== undefined) {
      categoryCounts[finding.category]++;
    }
  });
  
  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web3FuzzForge Security Report - ${options.project}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3, h4 {
      color: #2c3e50;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .summary-box {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .dashboard {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .dashboard-item {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .finding {
      background-color: #fff;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-left: 5px solid #ccc;
    }
    .finding.CRITICAL { border-left-color: ${SEVERITY_LEVELS.CRITICAL.color}; }
    .finding.HIGH { border-left-color: ${SEVERITY_LEVELS.HIGH.color}; }
    .finding.MEDIUM { border-left-color: ${SEVERITY_LEVELS.MEDIUM.color}; }
    .finding.LOW { border-left-color: ${SEVERITY_LEVELS.LOW.color}; }
    .finding.INFO { border-left-color: ${SEVERITY_LEVELS.INFO.color}; }
    
    .severity-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .severity-badge.CRITICAL { background-color: ${SEVERITY_LEVELS.CRITICAL.color}; }
    .severity-badge.HIGH { background-color: ${SEVERITY_LEVELS.HIGH.color}; }
    .severity-badge.MEDIUM { background-color: ${SEVERITY_LEVELS.MEDIUM.color}; }
    .severity-badge.LOW { background-color: ${SEVERITY_LEVELS.LOW.color}; }
    .severity-badge.INFO { background-color: ${SEVERITY_LEVELS.INFO.color}; }
    
    .category-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 12px;
      background-color: #e0e0e0;
      margin-left: 5px;
    }
    
    .chart-container {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    .chart {
      width: 45%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .steps {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 3px;
      margin-top: 10px;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
    }
    .evidence {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 15px;
    }
    .evidence img {
      max-width: 300px;
      border: 1px solid #ddd;
      border-radius: 3px;
    }
    footer {
      margin-top: 50px;
      text-align: center;
      color: #777;
      font-size: 14px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Web3FuzzForge Security Report</h1>
    <p>Project: ${options.project}</p>
    <p>Date: ${reportDate} | Time: ${reportTime}</p>
  </div>
  
  <div class="summary-box">
    <h2>Executive Summary</h2>
    <p>This report presents the results of automated security testing performed on the ${options.project} using Web3FuzzForge. The testing focused on identifying potential security vulnerabilities in wallet interactions, transactions, and user interfaces.</p>
    
    <div class="dashboard">
      <div class="dashboard-item" style="background-color: #f9f9f9;">
        <h3>Total Findings</h3>
        <p style="font-size: 24px; font-weight: bold;">${findings.length}</p>
      </div>
      <div class="dashboard-item" style="background-color: ${SEVERITY_LEVELS.CRITICAL.color}20;">
        <h3>Critical</h3>
        <p style="font-size: 24px; font-weight: bold;">${severityCounts.CRITICAL}</p>
      </div>
      <div class="dashboard-item" style="background-color: ${SEVERITY_LEVELS.HIGH.color}20;">
        <h3>High</h3>
        <p style="font-size: 24px; font-weight: bold;">${severityCounts.HIGH}</p>
      </div>
      <div class="dashboard-item" style="background-color: ${SEVERITY_LEVELS.MEDIUM.color}20;">
        <h3>Medium</h3>
        <p style="font-size: 24px; font-weight: bold;">${severityCounts.MEDIUM}</p>
      </div>
      <div class="dashboard-item" style="background-color: ${SEVERITY_LEVELS.LOW.color}20;">
        <h3>Low</h3>
        <p style="font-size: 24px; font-weight: bold;">${severityCounts.LOW}</p>
      </div>
      <div class="dashboard-item" style="background-color: ${SEVERITY_LEVELS.INFO.color}20;">
        <h3>Info</h3>
        <p style="font-size: 24px; font-weight: bold;">${severityCounts.INFO}</p>
      </div>
    </div>
  </div>
  
  <h2>Findings by Category</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Description</th>
      <th>Count</th>
    </tr>
    ${Object.entries(VULNERABILITY_CATEGORIES).map(([key, category]) => `
    <tr>
      <td><strong>${key}: ${category.name}</strong></td>
      <td>${category.description}</td>
      <td>${categoryCounts[key]}</td>
    </tr>
    `).join('')}
  </table>
  
  <h2>Detailed Findings</h2>
  ${findings.map(finding => `
  <div class="finding ${finding.severity}">
    <h3>${finding.title} <span class="severity-badge ${finding.severity}">${finding.severity}</span> <span class="category-badge">${finding.category}: ${finding.categoryName}</span></h3>
    <p><strong>ID:</strong> ${finding.id}</p>
    <p><strong>Description:</strong> ${finding.description}</p>
    <p><strong>Category:</strong> ${finding.category} - ${finding.categoryName} (${finding.categoryDescription})</p>
    ${finding.remediation ? `<p><strong>Remediation:</strong> ${finding.remediation}</p>` : ''}
    
    ${finding.steps_to_reproduce && finding.steps_to_reproduce.length > 0 ? `
    <div class="steps">
      <p><strong>Steps to Reproduce:</strong></p>
      <ol>
        ${finding.steps_to_reproduce.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    
    ${finding.evidence && finding.evidence.length > 0 ? `
    <div class="evidence">
      ${finding.evidence.map(item => {
        if (item.path && (item.path.endsWith('.png') || item.path.endsWith('.jpg') || item.path.endsWith('.jpeg'))) {
          return `<img src="${item.path}" alt="Evidence screenshot" />`;
        }
        return '';
      }).join('')}
    </div>
    ` : ''}
  </div>
  `).join('')}
  
  <footer>
    <p>Generated by Web3FuzzForge Security Testing Framework</p>
    <p>© ${new Date().getFullYear()} Web3FuzzForge</p>
  </footer>
</body>
</html>
  `;
  
  // Write HTML report
  const htmlPath = path.join(options.output, `${options.project.replace(/\s+/g, '-')}-report.html`);
  await fs.writeFile(htmlPath, html);
  
  console.log(chalk.green(`HTML report generated: ${htmlPath}`));
}

/**
 * Generate JSON report
 */
async function generateJsonReport(findings, options) {
  console.log(chalk.blue('Generating JSON report...'));
  
  const report = {
    project: options.project,
    timestamp: new Date().toISOString(),
    summary: {
      total_findings: findings.length,
      severity_counts: {
        critical: findings.filter(f => f.severity === 'CRITICAL').length,
        high: findings.filter(f => f.severity === 'HIGH').length,
        medium: findings.filter(f => f.severity === 'MEDIUM').length,
        low: findings.filter(f => f.severity === 'LOW').length,
        info: findings.filter(f => f.severity === 'INFO').length
      },
      category_counts: {}
    },
    findings: findings
  };
  
  // Count by category
  Object.keys(VULNERABILITY_CATEGORIES).forEach(key => {
    report.summary.category_counts[key] = findings.filter(f => f.category === key).length;
  });
  
  // Write JSON report
  const jsonPath = path.join(options.output, `${options.project.replace(/\s+/g, '-')}-report.json`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  
  console.log(chalk.green(`JSON report generated: ${jsonPath}`));
}

/**
 * Generate PDF report
 * Note: This is a placeholder. In a real implementation, you would use a PDF library.
 */
async function generatePdfReport(findings, options) {
  console.log(chalk.yellow('PDF report generation requires a PDF library.'));
  console.log(chalk.yellow('For a complete implementation, install a library like PDFKit or use a HTML-to-PDF converter.'));
  
  // This would typically use a library like PDFKit to generate a PDF
  const pdfPath = path.join(options.output, `${options.project.replace(/\s+/g, '-')}-report.pdf`);
  await fs.writeFile(pdfPath, 'PDF Placeholder - Implement with PDF library');
  
  console.log(chalk.green(`PDF placeholder generated: ${pdfPath}`));
}

/**
 * Generate summary
 */
function generateSummary(findings, options) {
  // Count by severity
  const severityCounts = {
    CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: findings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
    LOW: findings.filter(f => f.severity === 'LOW').length,
    INFO: findings.filter(f => f.severity === 'INFO').length
  };
  
  // Count by category
  const categoryCounts = {};
  Object.keys(VULNERABILITY_CATEGORIES).forEach(key => {
    categoryCounts[key] = findings.filter(f => f.category === key).length;
  });
  
  console.log(chalk.blue('\nSecurity Report Summary:'));
  console.log(chalk.blue('========================'));
  console.log(chalk.white(`Project: ${options.project}`));
  console.log(chalk.white(`Date: ${new Date().toLocaleDateString()}`));
  console.log(chalk.white(`Total Findings: ${findings.length}`));
  console.log('');
  
  console.log(chalk.blue('Findings by Severity:'));
  console.log(chalk.red(`  Critical: ${severityCounts.CRITICAL}`));
  console.log(chalk.hex(SEVERITY_LEVELS.HIGH.color)(`  High:     ${severityCounts.HIGH}`));
  console.log(chalk.hex(SEVERITY_LEVELS.MEDIUM.color)(`  Medium:   ${severityCounts.MEDIUM}`));
  console.log(chalk.hex(SEVERITY_LEVELS.LOW.color)(`  Low:      ${severityCounts.LOW}`));
  console.log(chalk.hex(SEVERITY_LEVELS.INFO.color)(`  Info:     ${severityCounts.INFO}`));
  console.log('');
  
  console.log(chalk.blue('Findings by Category:'));
  Object.entries(VULNERABILITY_CATEGORIES).forEach(([key, category]) => {
    console.log(chalk.white(`  ${key}: ${category.name} - ${categoryCounts[key]}`));
  });
  
  // Also save summary to file
  const summaryPath = path.join(options.output, `${options.project.replace(/\s+/g, '-')}-summary.txt`);
  const summaryContent = `
Security Report Summary
======================
Project: ${options.project}
Date: ${new Date().toLocaleDateString()}
Total Findings: ${findings.length}

Findings by Severity:
- Critical: ${severityCounts.CRITICAL}
- High:     ${severityCounts.HIGH}
- Medium:   ${severityCounts.MEDIUM}
- Low:      ${severityCounts.LOW}
- Info:     ${severityCounts.INFO}

Findings by Category:
${Object.entries(VULNERABILITY_CATEGORIES).map(([key, category]) => `- ${key}: ${category.name} - ${categoryCounts[key]}`).join('\n')}
`;

  fs.writeFileSync(summaryPath, summaryContent);
  console.log(chalk.green(`\nSummary saved to: ${summaryPath}`));
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('Error generating report:'));
  console.error(error);
  process.exit(1);
}); 