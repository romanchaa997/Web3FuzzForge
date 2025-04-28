/**
 * Security Report Generator
 * 
 * Generates detailed security reports from npm audit, dependency checks,
 * and other security scans.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Define severity levels and their colors
const SEVERITY_LEVELS = {
  critical: { color: 'red', priority: 1, emoji: '🔥' },
  high: { color: 'redBright', priority: 2, emoji: '⚠️' },
  moderate: { color: 'yellow', priority: 3, emoji: '⚡' },
  low: { color: 'blue', priority: 4, emoji: 'ℹ️' },
  info: { color: 'green', priority: 5, emoji: '📝' }
};

/**
 * Generate a comprehensive security report
 */
async function generateReport(options = {}) {
  const {
    npmAuditPath = 'security-reports/npm-audit.json',
    dependencyCheckPath = 'security-reports/dependency-check.log',
    outputPath = 'security-reports/security-report.md',
    generateHtml = true,
    includeRemediation = true
  } = options;

  console.log(chalk.blue('Generating security report...'));
  
  // Collect data from various sources
  const npmAuditData = getNpmAuditData(npmAuditPath);
  const dependencyCheckData = getDependencyCheckData(dependencyCheckPath);
  
  // Generate report content
  const reportContent = createReportContent(npmAuditData, dependencyCheckData, includeRemediation);
  
  // Write markdown report
  fs.writeFileSync(outputPath, reportContent);
  console.log(chalk.green(`Security report generated at: ${outputPath}`));
  
  // Generate HTML if requested
  if (generateHtml) {
    const htmlPath = outputPath.replace('.md', '.html');
    const htmlContent = convertMarkdownToHtml(reportContent);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(chalk.green(`HTML report generated at: ${htmlPath}`));
  }
  
  // Print summary
  const summary = generateSummary(npmAuditData, dependencyCheckData);
  console.log('\nSecurity Report Summary:');
  console.log(summary);
  
  return { reportPath: outputPath, summary };
}

/**
 * Get data from npm audit JSON file
 */
function getNpmAuditData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(chalk.yellow(`Warning: NPM audit file not found at ${filePath}`));
      return { vulnerabilities: [] };
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(chalk.red(`Error parsing npm audit data: ${error.message}`));
    return { vulnerabilities: [] };
  }
}

/**
 * Get data from dependency check log
 */
function getDependencyCheckData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(chalk.yellow(`Warning: Dependency check log not found at ${filePath}`));
      return { vulnerableDependencies: [] };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const vulnerableDependencies = [];
    
    // Parse the log content
    let currentVulnerability = null;
    
    content.split('\n').forEach(line => {
      // Detect vulnerable dependency lines
      if (line.includes('Found potentially vulnerable dependency:')) {
        const dependency = line.split(':')[1]?.trim();
        if (dependency) {
          currentVulnerability = {
            name: dependency,
            severity: 'moderate', // Default
            details: []
          };
        }
      } 
      // Collect additional details
      else if (currentVulnerability && line.trim().startsWith('Affected versions:')) {
        currentVulnerability.details.push(line.trim());
      }
      else if (currentVulnerability && line.trim().startsWith('Issue:')) {
        currentVulnerability.details.push(line.trim());
        // Detect severity from issue description
        if (line.includes('critical') || line.includes('RCE')) {
          currentVulnerability.severity = 'critical';
        } else if (line.includes('high')) {
          currentVulnerability.severity = 'high';
        }
      }
      else if (currentVulnerability && line.trim().startsWith('Recommended version:')) {
        currentVulnerability.details.push(line.trim());
        // Store the complete vulnerability
        vulnerableDependencies.push(currentVulnerability);
        currentVulnerability = null;
      }
    });
    
    return { vulnerableDependencies };
  } catch (error) {
    console.error(chalk.red(`Error parsing dependency check log: ${error.message}`));
    return { vulnerableDependencies: [] };
  }
}

/**
 * Create the report content in markdown format
 */
function createReportContent(npmAuditData, dependencyCheckData, includeRemediation) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  let content = `# Security Vulnerability Report

**Generated:** ${timestamp}

## Overview

This report contains security vulnerabilities detected in the project dependencies.

`;

  // Add npm audit vulnerabilities section
  content += `## NPM Audit Results

`;

  const npmVulnerabilities = npmAuditData.vulnerabilities || [];
  if (Object.keys(npmVulnerabilities).length === 0) {
    content += `No vulnerabilities found via npm audit.\n\n`;
  } else {
    // Sort by severity
    const vulnArray = Object.entries(npmVulnerabilities).map(([name, details]) => ({
      name,
      ...details
    }));
    
    const sortedVulns = vulnArray.sort((a, b) => {
      const aPriority = SEVERITY_LEVELS[a.severity]?.priority || 999;
      const bPriority = SEVERITY_LEVELS[b.severity]?.priority || 999;
      return aPriority - bPriority;
    });
    
    content += `### Vulnerabilities by Severity

| Severity | Count |
|----------|-------|
${Object.keys(SEVERITY_LEVELS).map(level => {
  const count = sortedVulns.filter(v => v.severity === level).length;
  if (count > 0) {
    return `| ${SEVERITY_LEVELS[level].emoji} ${level.toUpperCase()} | ${count} |`;
  }
  return null;
}).filter(Boolean).join('\n')}

### Detailed Findings

`;

    sortedVulns.forEach(vuln => {
      const severity = SEVERITY_LEVELS[vuln.severity] || SEVERITY_LEVELS.info;
      
      content += `### ${severity.emoji} ${vuln.name}

- **Severity:** ${vuln.severity.toUpperCase()}
- **Vulnerable Versions:** ${vuln.range || 'Not specified'}
- **Fixed Version:** ${vuln.fixAvailable?.version || 'No fix available'}

${vuln.overview || 'No detailed information available.'}

`;

      if (includeRemediation && vuln.fixAvailable) {
        content += `#### Remediation

\`\`\`bash
npm install ${vuln.name}@${vuln.fixAvailable.version}
\`\`\`

`;
      }
    });
  }

  // Add dependency check vulnerabilities section
  content += `## Custom Dependency Check Results

`;

  const depVulnerabilities = dependencyCheckData.vulnerableDependencies || [];
  if (depVulnerabilities.length === 0) {
    content += `No additional vulnerabilities found via custom dependency checks.\n\n`;
  } else {
    // Sort by severity
    const sortedDepVulns = depVulnerabilities.sort((a, b) => {
      const aPriority = SEVERITY_LEVELS[a.severity]?.priority || 999;
      const bPriority = SEVERITY_LEVELS[b.severity]?.priority || 999;
      return aPriority - bPriority;
    });
    
    content += `### Findings

`;

    sortedDepVulns.forEach(vuln => {
      const severity = SEVERITY_LEVELS[vuln.severity] || SEVERITY_LEVELS.moderate;
      
      content += `### ${severity.emoji} ${vuln.name}

- **Severity:** ${vuln.severity.toUpperCase()}
${vuln.details.map(detail => `- **${detail.split(':')[0]}:** ${detail.split(':')[1]?.trim() || ''}`).join('\n')}

`;
    });
  }

  // Add special section for @chainsafe/dappeteer
  content += `## Special Focus: @chainsafe/dappeteer

### 🔍 Custom Implementation Status

The project includes a custom wallet automation implementation to replace @chainsafe/dappeteer:

- Custom implementation: \`src/utils/custom-wallet-automation.js\`
- Migration guide: \`src/utils/SECURITY.md\`

### Migration Recommendations

1. Use the transitional wrapper: \`require('../src/utils/dappeteer-wrapper')\`
2. Test with custom implementation: \`require('../src/utils/custom-wallet-automation')\`
3. Remove @chainsafe/dappeteer dependency once fully migrated

## Next Steps

1. Address critical and high severity vulnerabilities first
2. Run \`npm run security:fix\` to apply automatic fixes
3. Test thoroughly after applying each fix
4. Complete migration to the custom wallet automation implementation
`;

  return content;
}

/**
 * Convert markdown report to HTML format
 */
function convertMarkdownToHtml(markdown) {
  // Very simple conversion for demonstration
  // In a real implementation, use a proper markdown to HTML converter
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Vulnerability Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2c3e50; }
    h1 { border-bottom: 2px solid #eaecef; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #eaecef; padding-bottom: 8px; margin-top: 30px; }
    h3 { margin-top: 25px; }
    code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    pre code { background-color: transparent; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f5f5f5; }
    .critical { color: #e74c3c; }
    .high { color: #e67e22; }
    .moderate { color: #f39c12; }
    .low { color: #3498db; }
    .info { color: #2ecc71; }
  </style>
</head>
<body>
`;

  // Simple conversions - this is not a full markdown parser
  html += markdown
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`{3}bash\n([\s\S]*?)\n`{3}/g, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/^\| (.*?) \|$/gm, '<tr><td>$1</td></tr>')
    .replace(/\| (.*?) \|/g, '<td>$1</td>');

  // Replace severity keywords with colored versions
  Object.keys(SEVERITY_LEVELS).forEach(level => {
    const pattern = new RegExp(`${level.toUpperCase()}`, 'g');
    html = html.replace(pattern, `<span class="${level}">${level.toUpperCase()}</span>`);
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Generate a summary of the security issues
 */
function generateSummary(npmAuditData, dependencyCheckData) {
  // Count vulnerabilities by severity
  const npmVulnerabilities = npmAuditData.vulnerabilities || {};
  const depVulnerabilities = dependencyCheckData.vulnerableDependencies || [];
  
  const counts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0
  };
  
  // Count npm audit vulnerabilities
  Object.values(npmVulnerabilities).forEach(vuln => {
    counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
  });
  
  // Count dependency check vulnerabilities
  depVulnerabilities.forEach(vuln => {
    counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
  });
  
  // Generate summary text
  let summary = '';
  
  Object.keys(SEVERITY_LEVELS).forEach(level => {
    if (counts[level] > 0) {
      const severity = SEVERITY_LEVELS[level];
      summary += chalk[severity.color](`${severity.emoji} ${level.toUpperCase()}: ${counts[level]}\n`);
    }
  });
  
  // Add overall assessment
  if (counts.critical > 0) {
    summary += chalk.red('\n⛔ CRITICAL ISSUES DETECTED - Immediate action required!\n');
  } else if (counts.high > 0) {
    summary += chalk.yellow('\n⚠️ HIGH SEVERITY ISSUES - Action required soon.\n');
  } else if (counts.moderate > 0) {
    summary += chalk.blue('\nℹ️ MODERATE ISSUES - Plan to address these issues.\n');
  } else {
    summary += chalk.green('\n✅ No significant issues detected.\n');
  }
  
  return summary;
}

module.exports = {
  generateReport,
  getNpmAuditData,
  getDependencyCheckData
}; 