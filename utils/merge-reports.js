const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Merges multiple Playwright HTML reports into a single report and enhances it with links to artifacts
 */
async function mergeReports() {
  const reportsDir = path.join(process.cwd(), 'reports')
  const testResultsDir = path.join(process.cwd(), 'test-results')
  const dataDir = path.join(process.cwd(), 'reports', 'data')

  // Ensure the reports directory exists
  fs.ensureDirSync(reportsDir)
  fs.ensureDirSync(dataDir)

  try {
    // Use Playwright's merge-reports command to merge all reports
    // This requires Playwright v1.32 or later
    console.log('Merging HTML reports...')
    execSync(`npx playwright merge-reports --reporter html ${reportsDir}`, { stdio: 'inherit' })

    // Collect fuzzing data and test artifacts
    collectAndLinkArtifacts(reportsDir, testResultsDir, dataDir)

    console.log(`Reports successfully merged at: ${reportsDir}`)
  } catch (error) {
    console.error('Error merging reports:', error.message)

    // Fallback: copy the most recent report to reports directory
    try {
      console.log('Attempting fallback: copying most recent report...')

      // If merge-reports failed, we'll copy the latest HTML report
      const playwright_report = path.join(process.cwd(), 'playwright-report')

      if (fs.existsSync(playwright_report)) {
        // Copy the latest report to the reports directory
        fs.copySync(playwright_report, reportsDir, { overwrite: true })

        // Still try to collect and link artifacts
        collectAndLinkArtifacts(reportsDir, testResultsDir, dataDir)

        console.log(`Latest report copied to: ${reportsDir}`)
      } else {
        console.log('No playwright-report directory found.')
      }
    } catch (fallbackError) {
      console.error('Error in fallback operation:', fallbackError.message)
    }
  }
}

/**
 * Collect test artifacts and fuzzing inputs and link them in the HTML report
 */
function collectAndLinkArtifacts(reportsDir, testResultsDir, dataDir) {
  console.log('Enhancing report with links to artifacts and fuzzed inputs...')

  try {
    // Generate artifact index
    const artifactIndex = {
      screenshots: [],
      fuzzedInputs: [],
      traces: [],
    }

    // Find all artifacts in test-output directory
    const testOutputDir = path.join(process.cwd(), 'test-output')
    if (fs.existsSync(testOutputDir)) {
      // Walk through test-output directory to find artifacts
      walkDirForArtifacts(testOutputDir, artifactIndex)
    }

    // Find all artifacts in test-results directory
    if (fs.existsSync(testResultsDir)) {
      // Walk through test-results directory to find artifacts
      walkDirForArtifacts(testResultsDir, artifactIndex)
    }

    // Generate artifact data for the report
    const artifactDataJson = JSON.stringify(artifactIndex, null, 2)
    fs.writeFileSync(path.join(dataDir, 'artifacts.json'), artifactDataJson)

    // Inject artifact links into the HTML report
    injectArtifactLinks(reportsDir, artifactIndex)

    console.log(
      `Artifacts indexed: ${artifactIndex.screenshots.length} screenshots, ${artifactIndex.fuzzedInputs.length} fuzzed inputs, ${artifactIndex.traces.length} traces`
    )
  } catch (error) {
    console.error('Error collecting artifacts:', error.message)
  }
}

/**
 * Walk directory to find test artifacts
 */
function walkDirForArtifacts(dir, artifactIndex) {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const fullPath = path.join(dir, file.name)

    if (file.isDirectory()) {
      walkDirForArtifacts(fullPath, artifactIndex)
    } else {
      // Categorize artifacts
      if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
        // Screenshot
        const relPath = path.relative(process.cwd(), fullPath)
        artifactIndex.screenshots.push({
          path: relPath,
          name: file.name,
          time: fs.statSync(fullPath).mtime,
        })

        // Check for fuzzing inputs in filename
        if (
          file.name.includes('xss-test') ||
          file.name.includes('large-amount') ||
          file.name.includes('fuzz')
        ) {
          artifactIndex.fuzzedInputs.push({
            path: relPath,
            name: file.name,
            type: getTestType(file.name),
            time: fs.statSync(fullPath).mtime,
          })
        }
      } else if (file.name.endsWith('.zip') && file.name.includes('trace')) {
        // Trace artifact
        const relPath = path.relative(process.cwd(), fullPath)
        artifactIndex.traces.push({
          path: relPath,
          name: file.name,
          time: fs.statSync(fullPath).mtime,
        })
      }
    }
  }
}

/**
 * Determine test type from filename
 */
function getTestType(filename) {
  if (filename.includes('xss-test')) return 'XSS Test'
  if (filename.includes('large-amount')) return 'Large Amount Test'
  if (filename.includes('eth-sign')) return 'Ethereum Sign Test'
  return 'Fuzz Test'
}

/**
 * Inject artifact links into HTML report
 */
function injectArtifactLinks(reportsDir, artifactIndex) {
  const indexPath = path.join(reportsDir, 'index.html')

  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8')

    // Inject JavaScript to display artifact links
    const scriptToInject = `
<script>
// Load artifact data for the report
fetch('./data/artifacts.json')
  .then(response => response.json())
  .then(data => {
    // Create artifact tab in the UI
    const tabContainer = document.querySelector('.sp-tab-strip');
    if (!tabContainer) return;
    
    // Add Artifacts tab
    const artifactsTab = document.createElement('div');
    artifactsTab.className = 'sp-tab';
    artifactsTab.textContent = 'Artifacts & Fuzzing Inputs';
    artifactsTab.onclick = () => showArtifacts(data);
    tabContainer.appendChild(artifactsTab);
    
    // Function to show artifacts
    function showArtifacts(data) {
      // Remove active class from other tabs
      document.querySelectorAll('.sp-tab').forEach(tab => tab.classList.remove('sp-active'));
      artifactsTab.classList.add('sp-active');
      
      // Clear main content
      const mainElement = document.querySelector('main');
      if (!mainElement) return;
      mainElement.innerHTML = '';
      
      // Create artifact view
      const artifactView = document.createElement('div');
      artifactView.className = 'artifacts-view';
      
      // Build HTML content
      let fuzzingInputsHTML = '';
      if (data.fuzzedInputs.length) {
        fuzzingInputsHTML = data.fuzzedInputs.map(item => 
          '<div class="artifact-card">' +
            '<a href="../' + item.path + '" target="_blank">' +
              '<div class="artifact-thumb">' +
                '<img src="../' + item.path + '" alt="' + item.name + '">' +
              '</div>' +
              '<div class="artifact-info">' +
                '<div class="artifact-name">' + item.name + '</div>' +
                '<div class="artifact-type">' + item.type + '</div>' +
              '</div>' +
            '</a>' +
          '</div>'
        ).join('');
      } else {
        fuzzingInputsHTML = '<p class="empty-message">No fuzzing input artifacts available</p>';
      }
      
      let screenshotsHTML = '';
      if (data.screenshots.length) {
        screenshotsHTML = data.screenshots
          .filter(item => !data.fuzzedInputs.some(f => f.path === item.path))
          .map(item => 
            '<div class="artifact-card">' +
              '<a href="../' + item.path + '" target="_blank">' +
                '<div class="artifact-thumb">' +
                  '<img src="../' + item.path + '" alt="' + item.name + '">' +
                '</div>' +
                '<div class="artifact-info">' +
                  '<div class="artifact-name">' + item.name + '</div>' +
                '</div>' +
              '</a>' +
            '</div>'
          ).join('');
      } else {
        screenshotsHTML = '<p class="empty-message">No screenshot artifacts available</p>';
      }
      
      let tracesHTML = '';
      if (data.traces.length) {
        tracesHTML = data.traces.map(item => 
          '<div class="artifact-card">' +
            '<a href="../' + item.path + '" target="_blank">' +
              '<div class="artifact-thumb">' +
                '<div style="font-size: 48px;">📊</div>' +
              '</div>' +
              '<div class="artifact-info">' +
                '<div class="artifact-name">' + item.name + '</div>' +
              '</div>' +
            '</a>' +
          '</div>'
        ).join('');
      } else {
        tracesHTML = '<p class="empty-message">No trace artifacts available</p>';
      }
      
      artifactView.innerHTML = 
        '<style>' +
        '  .artifacts-view { padding: 20px; }' +
        '  .artifacts-section { margin-bottom: 30px; }' +
        '  .artifacts-section h2 { ' +
        '    font-size: 18px; ' +
        '    margin-bottom: 10px;' +
        '    border-bottom: 1px solid #ddd;' +
        '    padding-bottom: 5px;' +
        '  }' +
        '  .artifacts-grid {' +
        '    display: grid;' +
        '    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));' +
        '    gap: 15px;' +
        '  }' +
        '  .artifact-card {' +
        '    border: 1px solid #ddd;' +
        '    border-radius: 6px;' +
        '    overflow: hidden;' +
        '    transition: transform 0.2s;' +
        '  }' +
        '  .artifact-card:hover {' +
        '    transform: translateY(-3px);' +
        '    box-shadow: 0 5px 15px rgba(0, 0,0,0.1);' +
        '  }' +
        '  .artifact-card a {' +
        '    display: flex;' +
        '    flex-direction: column;' +
        '    height: 100%;' +
        '    text-decoration: none;' +
        '    color: inherit;' +
        '  }' +
        '  .artifact-thumb {' +
        '    height: 150px;' +
        '    background-color: #f5f5f5;' +
        '    display: flex;' +
        '    align-items: center;' +
        '    justify-content: center;' +
        '    overflow: hidden;' +
        '  }' +
        '  .artifact-thumb img {' +
        '    max-width: 100%;' +
        '    max-height: 100%;' +
        '    object-fit: contain;' +
        '  }' +
        '  .artifact-info {' +
        '    padding: 10px;' +
        '  }' +
        '  .artifact-name {' +
        '    font-weight: bold;' +
        '    font-size: 14px;' +
        '    margin-bottom: 5px;' +
        '    word-break: break-word;' +
        '  }' +
        '  .artifact-type {' +
        '    font-size: 12px;' +
        '    color: #666;' +
        '  }' +
        '  .empty-message {' +
        '    font-style: italic;' +
        '    color: #666;' +
        '  }' +
        '</style>' +
        
        '<div class="artifacts-section">' +
        '  <h2>Fuzzing Inputs</h2>' +
        '  <div class="artifacts-grid">' +
        fuzzingInputsHTML +
        '  </div>' +
        '</div>' +
        
        '<div class="artifacts-section">' +
        '  <h2>Screenshots</h2>' +
        '  <div class="artifacts-grid">' +
        screenshotsHTML +
        '  </div>' +
        '</div>' +
        
        '<div class="artifacts-section">' +
        '  <h2>Traces</h2>' +
        '  <div class="artifacts-grid">' +
        tracesHTML +
        '  </div>' +
        '</div>';
      
      mainElement.appendChild(artifactView);
    }
  })
  .catch(err => console.error('Error loading artifact data:', err));
</script>
    `

    // Insert the script before closing body tag
    html = html.replace('</body>', `${scriptToInject}\n</body>`)

    // Write updated HTML
    fs.writeFileSync(indexPath, html)
  }
}

// Run if script is executed directly
if (require.main === module) {
  mergeReports()
}

module.exports = { mergeReports }
