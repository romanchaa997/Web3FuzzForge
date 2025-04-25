/**
 * Benchmark Comparison Utility
 *
 * Compares current benchmark results with previous runs and generates
 * a formatted report for CI/CD pipelines and pull request comments.
 */

const fs = require('fs')
const path = require('path')

// Parse command line arguments
const args = parseArguments()
const currentResultsPath = args.current
const previousResultsPath = args.previous
const outputPath = args.output

// Main function to compare benchmarks
function compareBenchmarks() {
  try {
    console.log('Comparing benchmark results...')

    // Check if the results files exist
    if (!fs.existsSync(currentResultsPath)) {
      console.error(`Current results file not found: ${currentResultsPath}`)
      process.exit(1)
    }

    if (!fs.existsSync(previousResultsPath)) {
      console.error(`Previous results file not found: ${previousResultsPath}`)
      process.exit(1)
    }

    // Read results files
    const currentResults = JSON.parse(fs.readFileSync(currentResultsPath, 'utf8'))
    const previousResults = JSON.parse(fs.readFileSync(previousResultsPath, 'utf8'))

    // Generate comparison report
    const comparisonReport = generateComparisonReport(currentResults, previousResults)

    // Write comparison report to file if output path is specified
    if (outputPath) {
      fs.writeFileSync(outputPath, comparisonReport)
      console.log(`Comparison report saved to: ${outputPath}`)
    } else {
      console.log('\n===== BENCHMARK COMPARISON REPORT =====\n')
      console.log(comparisonReport)
    }
  } catch (error) {
    console.error('Error comparing benchmarks:', error)
    process.exit(1)
  }
}

// Parse command line arguments
function parseArguments() {
  const args = {
    current: null,
    previous: null,
    output: null,
  }

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i]

    if (arg === '--current' && i + 1 < process.argv.length) {
      args.current = process.argv[i + 1]
    } else if (arg === '--previous' && i + 1 < process.argv.length) {
      args.previous = process.argv[i + 1]
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      args.output = process.argv[i + 1]
    }
  }

  // Validate required arguments
  if (!args.current || !args.previous) {
    console.error('Missing required arguments. Usage:')
    console.error(
      '  node compare-benchmarks.js --current <current-results.json> --previous <previous-results.json> [--output <output-file.md>]'
    )
    process.exit(1)
  }

  return args
}

// Generate comparison report in Markdown format
function generateComparisonReport(current, previous) {
  const currentMetrics = current.metrics
  const previousMetrics = previous.metrics

  // Calculate differences
  const totalDurationDiff = currentMetrics.totalDuration - previousMetrics.totalDuration
  const averageDurationDiff = currentMetrics.averageDuration - previousMetrics.averageDuration
  const percentageDurationChange =
    previousMetrics.averageDuration > 0
      ? ((averageDurationDiff / previousMetrics.averageDuration) * 100).toFixed(2)
      : 0

  const isPerformanceImproved = averageDurationDiff < 0

  // Build report header
  let report = '# Web3FuzzForge Performance Benchmark Results\n\n'

  report += '## Summary\n\n'
  report += '| Metric | Current | Previous | Change |\n'
  report += '| ------ | ------- | -------- | ------ |\n'
  report += `| Total Tests | ${currentMetrics.totalTests} | ${previousMetrics.totalTests} | ${getDiffSymbol(currentMetrics.totalTests - previousMetrics.totalTests)} ${Math.abs(currentMetrics.totalTests - previousMetrics.totalTests)} |\n`
  report += `| Passed Tests | ${currentMetrics.passedTests} | ${previousMetrics.passedTests} | ${getDiffSymbol(currentMetrics.passedTests - previousMetrics.passedTests)} ${Math.abs(currentMetrics.passedTests - previousMetrics.passedTests)} |\n`
  report += `| Failed Tests | ${currentMetrics.failedTests} | ${previousMetrics.failedTests} | ${getDiffSymbol(currentMetrics.failedTests - previousMetrics.failedTests, true)} ${Math.abs(currentMetrics.failedTests - previousMetrics.failedTests)} |\n`
  report += `| Total Duration | ${formatDuration(currentMetrics.totalDuration)} | ${formatDuration(previousMetrics.totalDuration)} | ${getDiffSymbol(-totalDurationDiff)} ${formatDuration(Math.abs(totalDurationDiff))} |\n`
  report += `| Average Duration | ${formatDuration(currentMetrics.averageDuration)} | ${formatDuration(previousMetrics.averageDuration)} | ${getDiffSymbol(-averageDurationDiff)} ${formatDuration(Math.abs(averageDurationDiff))} (${Math.abs(percentageDurationChange)}%) |\n\n`

  // Overall performance status
  if (isPerformanceImproved) {
    report += '## 🚀 Performance Improved\n\n'
    report += `Tests are running **${Math.abs(percentageDurationChange)}% faster** on average compared to the previous benchmark.\n\n`
  } else if (Math.abs(percentageDurationChange) < 3) {
    report += '## ✅ Performance Stable\n\n'
    report += `Test performance is **stable** with only a ${Math.abs(percentageDurationChange)}% change compared to the previous benchmark.\n\n`
  } else {
    report += '## ⚠️ Performance Regression\n\n'
    report += `Tests are running **${Math.abs(percentageDurationChange)}% slower** on average compared to the previous benchmark.\n\n`
  }

  // Test comparison details
  const testComparisonData = compareTestDurations(
    currentMetrics.testDurations, previousMetrics.testDurations
  )

  // Add improved tests section
  if (testComparisonData.improved.length > 0) {
    report += '## Most Improved Tests\n\n'
    report += '| Test | Current | Previous | Improvement |\n'
    report += '| ---- | ------- | -------- | ----------- |\n'

    testComparisonData.improved.slice(0, 5).forEach(test => {
      report += `| ${test.name} | ${formatDuration(test.currentDuration)} | ${formatDuration(test.previousDuration)} | ${formatDuration(Math.abs(test.diff))} (${Math.abs(test.percentChange).toFixed(2)}%) |\n`
    })

    report += '\n'
  }

  // Add regressed tests section
  if (testComparisonData.regressed.length > 0) {
    report += '## Tests with Performance Regressions\n\n'
    report += '| Test | Current | Previous | Regression |\n'
    report += '| ---- | ------- | -------- | ---------- |\n'

    testComparisonData.regressed.slice(0, 5).forEach(test => {
      report += `| ${test.name} | ${formatDuration(test.currentDuration)} | ${formatDuration(test.previousDuration)} | ${formatDuration(Math.abs(test.diff))} (${Math.abs(test.percentChange).toFixed(2)}%) |\n`
    })

    report += '\n'
  }

  // New and removed tests
  if (testComparisonData.new.length > 0) {
    report += '## New Tests\n\n'
    report += `${testComparisonData.new.length} new tests were added in this run.\n\n`
  }

  if (testComparisonData.removed.length > 0) {
    report += '## Removed Tests\n\n'
    report += `${testComparisonData.removed.length} tests from the previous run were removed.\n\n`
  }

  // Timestamp
  report += `\n\n*Report generated at ${new Date().toISOString()}*`

  return report
}

// Compare test durations and categorize them
function compareTestDurations(current, previous) {
  const result = {
    improved: [],
    regressed: [],
    unchanged: [],
    new: [],
    removed: [],
  }

  // Find improved, regressed, and unchanged tests
  for (const [testName, currentDuration] of Object.entries(current)) {
    if (testName in previous) {
      const previousDuration = previous[testName]
      const diff = currentDuration - previousDuration
      const percentChange = previousDuration > 0 ? (diff / previousDuration) * 100 : 0

      const comparison = {
        name: testName,
        currentDuration,
        previousDuration,
        diff,
        percentChange,
      }

      if (diff < 0) {
        result.improved.push(comparison)
      } else if (diff > 0) {
        result.regressed.push(comparison)
      } else {
        result.unchanged.push(comparison)
      }
    } else {
      result.new.push({
        name: testName, duration: currentDuration,
      })
    }
  }

  // Find removed tests
  for (const testName of Object.keys(previous)) {
    if (!(testName in current)) {
      result.removed.push({
        name: testName, duration: previous[testName],
      })
    }
  }

  // Sort improved tests by largest improvement percentage
  result.improved.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))

  // Sort regressed tests by largest regression percentage
  result.regressed.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))

  return result
}

// Get symbol for diff (up arrow for increase, down arrow for decrease)
function getDiffSymbol(diff, invertForFailures = false) {
  if (diff === 0) {
    return '—'
  }

  // For failures, we want down arrow to be good (green)
  if (invertForFailures) {
    return diff < 0 ? '🟢 ↓' : '🔴 ↑'
  }

  return diff > 0 ? '🟢 ↑' : '🔴 ↓'
}

// Format duration in milliseconds as a human-readable string
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(2)
    return `${minutes}m ${seconds}s`
  }
}

// Execute the comparison
compareBenchmarks()
