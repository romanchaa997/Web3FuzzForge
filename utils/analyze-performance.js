/**
 * Performance Benchmark Analysis Utility
 *
 * This script analyzes test execution times from Playwright JSON reports
 * and generates performance metrics for benchmarking.
 */

const fs = require('fs')
const path = require('path')

// Configuration
const BENCHMARK_RESULTS_DIR = path.join(process.cwd(), 'benchmark-results')
const JSON_RESULTS_PATH =
  process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || path.join(BENCHMARK_RESULTS_DIR, 'results.json')
const PREVIOUS_RESULTS_PATH = path.join(BENCHMARK_RESULTS_DIR, 'previous.json')
const OUTPUT_PATH = path.join(BENCHMARK_RESULTS_DIR, 'metrics.json')

// Ensure the benchmark results directory exists
if (!fs.existsSync(BENCHMARK_RESULTS_DIR)) {
  fs.mkdirSync(BENCHMARK_RESULTS_DIR, { recursive: true })
}

// Main function to analyze performance
async function analyzeBenchmarks() {
  try {
    console.log('Analyzing performance benchmarks...')

    // Check if the results file exists
    if (!fs.existsSync(JSON_RESULTS_PATH)) {
      console.error(`Results file not found: ${JSON_RESULTS_PATH}`)
      process.exit(1)
    }

    // Read the results file
    const rawData = fs.readFileSync(JSON_RESULTS_PATH, 'utf8')
    const resultsData = JSON.parse(rawData)

    // Extract test metrics
    const metrics = extractTestMetrics(resultsData)

    // Compare with previous results if available
    let comparison = null
    if (fs.existsSync(PREVIOUS_RESULTS_PATH)) {
      const previousRawData = fs.readFileSync(PREVIOUS_RESULTS_PATH, 'utf8')
      const previousData = JSON.parse(previousRawData)
      comparison = compareWithPrevious(metrics, previousData)
    }

    // Save current results as previous for next run
    if (fs.existsSync(JSON_RESULTS_PATH)) {
      fs.copyFileSync(JSON_RESULTS_PATH, PREVIOUS_RESULTS_PATH)
    }

    // Save the metrics
    const output = {
      timestamp: new Date().toISOString(),
      metrics,
      comparison,
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))

    console.log(`Performance metrics saved to: ${OUTPUT_PATH}`)

    // Print summary to console
    printSummary(metrics)

    if (comparison) {
      printComparisonSummary(comparison)
    }
  } catch (error) {
    console.error('Error analyzing benchmarks:', error)
    process.exit(1)
  }
}

// Extract test metrics from Playwright results
function extractTestMetrics(results) {
  const metrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    totalDuration: 0,
    averageDuration: 0,
    testDurations: {},
    slowestTests: [],
    fastestTests: [],
  }

  // Process test results
  if (results.suites) {
    processTestSuites(results.suites, metrics)
  }

  // Calculate average duration
  if (metrics.totalTests > 0) {
    metrics.averageDuration = metrics.totalDuration / metrics.totalTests
  }

  // Find slowest and fastest tests
  const testDurations = Object.entries(metrics.testDurations).map(([name, duration]) => ({
    name, duration,
  }))

  // Sort by duration (descending for slowest)
  testDurations.sort((a, b) => b.duration - a.duration)
  metrics.slowestTests = testDurations.slice(0, 5)

  // Sort by duration (ascending for fastest)
  testDurations.sort((a, b) => a.duration - b.duration)
  metrics.fastestTests = testDurations.slice(0, 5)

  return metrics
}

// Process test suites recursively
function processTestSuites(suites, metrics, prefix = '') {
  for (const suite of suites) {
    const suiteName = prefix ? `${prefix} > ${suite.title}` : suite.title

    // Process tests in this suite
    if (suite.specs) {
      for (const spec of suite.specs) {
        metrics.totalTests += 1

        let testPassed = true
        let testDuration = 0

        if (spec.tests && spec.tests.length > 0) {
          // Use the first test result (usually there's only one)
          const test = spec.tests[0]

          if (test.results && test.results.length > 0) {
            const result = test.results[0]
            testDuration = result.duration || 0

            if (result.status === 'passed') {
              metrics.passedTests += 1
            } else if (result.status === 'failed') {
              metrics.failedTests += 1
              testPassed = false
            } else if (result.status === 'skipped') {
              metrics.skippedTests += 1
            }
          }
        }

        // Add to total duration
        metrics.totalDuration += testDuration

        // Record test duration
        const fullTestName = `${suiteName} > ${spec.title}`
        metrics.testDurations[fullTestName] = testDuration
      }
    }

    // Process nested suites
    if (suite.suites) {
      processTestSuites(suite.suites, metrics, suiteName)
    }
  }
}

// Compare with previous benchmark results
function compareWithPrevious(current, previous) {
  const comparison = {
    totalTestsDiff: current.totalTests - previous.totalTests,
    passedTestsDiff: current.passedTests - previous.passedTests,
    failedTestsDiff: current.failedTests - previous.failedTests,
    totalDurationDiff: current.totalDuration - previous.totalDuration,
    averageDurationDiff: current.averageDuration - previous.averageDuration,
    percentageDurationChange: 0,
    testComparisons: [],
  }

  // Calculate percentage change in average duration
  if (previous.averageDuration > 0) {
    comparison.percentageDurationChange =
      ((current.averageDuration - previous.averageDuration) / previous.averageDuration) * 100
  }

  // Compare individual test durations
  for (const [testName, currentDuration] of Object.entries(current.testDurations)) {
    if (previous.testDurations && testName in previous.testDurations) {
      const previousDuration = previous.testDurations[testName]
      const durationDiff = currentDuration - previousDuration
      let percentageChange = 0

      if (previousDuration > 0) {
        percentageChange = (durationDiff / previousDuration) * 100
      }

      comparison.testComparisons.push({
        testName,
        currentDuration,
        previousDuration,
        durationDiff,
        percentageChange,
      })
    }
  }

  // Sort by percentage change (largest change first)
  comparison.testComparisons.sort(
    (a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)
  )

  return comparison
}

// Print summary to console
function printSummary(metrics) {
  console.log('\n===== PERFORMANCE BENCHMARK SUMMARY =====')
  console.log(`Total Tests: ${metrics.totalTests}`)
  console.log(
    `Passed: ${metrics.passedTests} | Failed: ${metrics.failedTests} | Skipped: ${metrics.skippedTests}`
  )
  console.log(`Total Duration: ${formatDuration(metrics.totalDuration)}`)
  console.log(`Average Test Duration: ${formatDuration(metrics.averageDuration)}`)

  console.log('\n----- SLOWEST TESTS -----')
  metrics.slowestTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name} - ${formatDuration(test.duration)}`)
  })

  console.log('\n----- FASTEST TESTS -----')
  metrics.fastestTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name} - ${formatDuration(test.duration)}`)
  })
}

// Print comparison summary
function printComparisonSummary(comparison) {
  console.log('\n===== COMPARISON WITH PREVIOUS RUN =====')

  const durationChangeDirection = comparison.averageDurationDiff < 0 ? 'faster' : 'slower'
  const durationChangeEmoji = comparison.averageDurationDiff < 0 ? '🚀' : '⚠️'

  console.log(
    `Average Duration Change: ${formatDuration(Math.abs(comparison.averageDurationDiff))} ${durationChangeDirection} ${durationChangeEmoji}`
  )
  console.log(`Percentage Change: ${comparison.percentageDurationChange.toFixed(2)}%`)

  console.log('\n----- TESTS WITH LARGEST CHANGES -----')
  comparison.testComparisons.slice(0, 5).forEach((test, index) => {
    const changeDirection = test.durationDiff < 0 ? 'faster' : 'slower'
    console.log(
      `${index + 1}. ${test.testName} - ${formatDuration(Math.abs(test.durationDiff))} ${changeDirection} (${test.percentageChange.toFixed(2)}%)`
    )
  })
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

// Execute the analysis
analyzeBenchmarks().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
