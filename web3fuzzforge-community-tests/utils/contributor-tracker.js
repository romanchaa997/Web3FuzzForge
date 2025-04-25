/**
 * Contributor tracking utility for Web3FuzzForge community tests
 * This module handles acknowledging test contributors in the Hall of Fame
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Gets information about the current test contributor from git
 * @param {string} testFilePath - Path to the test file
 * @returns {Object} Contributor information
 */
function getContributorInfo(testFilePath) {
  try {
    // Get the latest contributor who modified this file
    const gitBlame = execSync(`git blame -p ${testFilePath} | head -n 1`).toString().trim()
    const commitHash = gitBlame.split(' ')[0]

    // Get author information from the commit
    const authorName = execSync(`git show -s --format='%an' ${commitHash}`).toString().trim()
    const authorEmail = execSync(`git show -s --format='%ae' ${commitHash}`).toString().trim()
    const commitDate = execSync(`git show -s --format='%cd' ${commitHash}`).toString().trim()

    return {
      name: authorName,
      email: authorEmail,
      date: commitDate,
      testPath: testFilePath,
      testName: path.basename(testFilePath),
      commitHash,
    }
  } catch (error) {
    console.error('Failed to get contributor info:', error.message)
    return {
      name: 'Unknown Contributor',
      testPath: testFilePath,
      testName: path.basename(testFilePath),
    }
  }
}

/**
 * Records a successful test contribution to the Hall of Fame
 * @param {string} testFilePath - Path to the test file
 * @param {Object} testMetadata - Additional metadata about the test
 * @returns {Promise<void>}
 */
async function recordContribution(testFilePath, testMetadata = {}) {
  const contributor = getContributorInfo(testFilePath)

  try {
    // Path to the contribution log file
    const contributionsPath = path.join(__dirname, '..', 'HALL_OF_FAME.json')

    // Read existing contributions or create new array
    let contributions = []
    if (fs.existsSync(contributionsPath)) {
      contributions = JSON.parse(fs.readFileSync(contributionsPath, 'utf-8'))
    }

    // Add new contribution
    contributions.push({
      contributor: contributor.name,
      date: new Date().toISOString(),
      testName: contributor.testName,
      testPath: contributor.testPath,
      type: testMetadata.type || 'Unknown',
      description: testMetadata.description || '',
      impactScore: testMetadata.impactScore || 1,
    })

    // Sort by date (newest first)
    contributions.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Save updated contributions
    fs.writeFileSync(contributionsPath, JSON.stringify(contributions, null, 2))

    console.log(
      `✅ Recorded contribution from ${contributor.name} for test ${contributor.testName}`
    )
  } catch (error) {
    console.error('Failed to record contribution:', error.message)
  }
}

/**
 * Generates the Hall of Fame markdown file from the contributions JSON
 * @returns {Promise<void>}
 */
async function generateHallOfFame() {
  try {
    const contributionsPath = path.join(__dirname, '..', 'HALL_OF_FAME.json')

    if (!fs.existsSync(contributionsPath)) {
      console.log('No contributions found yet.')
      return
    }

    const contributions = JSON.parse(fs.readFileSync(contributionsPath, 'utf-8'))

    // Group contributions by contributor
    const contributorMap = {}
    for (const contribution of contributions) {
      if (!contributorMap[contribution.contributor]) {
        contributorMap[contribution.contributor] = []
      }
      contributorMap[contribution.contributor].push(contribution)
    }

    // Generate markdown content
    let markdown = '# Web3FuzzForge Hall of Fame\n\n'
    markdown +=
      'This Hall of Fame celebrates the amazing contributors who have submitted Web3 fuzzing tests to help improve security across the ecosystem.\n\n'

    // Sort contributors by number of contributions
    const sortedContributors = Object.keys(contributorMap).sort(
      (a, b) => contributorMap[b].length - contributorMap[a].length
    )

    markdown += '## Top Contributors\n\n'
    markdown += '| Contributor | Tests Submitted | Impact Score |\n'
    markdown += '|-------------|----------------|-------------|\n'

    for (const contributor of sortedContributors) {
      const tests = contributorMap[contributor]
      const totalImpact = tests.reduce((sum, test) => sum + (test.impactScore || 1), 0)
      markdown += `| ${contributor} | ${tests.length} | ${totalImpact} |\n`
    }

    markdown += '\n## Recent Contributions\n\n'

    // Show the 10 most recent contributions
    const recentContributions = contributions.slice(0, 10)
    for (const contribution of recentContributions) {
      markdown += `### ${contribution.testName}\n\n`
      markdown += `- **Contributor**: ${contribution.contributor}\n`
      markdown += `- **Date**: ${new Date(contribution.date).toDateString()}\n`
      markdown += `- **Type**: ${contribution.type}\n`
      if (contribution.description) {
        markdown += `- **Description**: ${contribution.description}\n`
      }
      markdown += '\n'
    }

    // Add footer
    markdown += '\n---\n\n'
    markdown +=
      'Want to see your name here? Submit a pull request with your own Web3 fuzzing test!\n'

    // Write to markdown file
    fs.writeFileSync(path.join(__dirname, '..', 'HALL_OF_FAME.md'), markdown)

    console.log('✅ Hall of Fame has been updated!')
  } catch (error) {
    console.error('Failed to generate Hall of Fame:', error.message)
  }
}

module.exports = {
  getContributorInfo,
  recordContribution,
  generateHallOfFame,
}
