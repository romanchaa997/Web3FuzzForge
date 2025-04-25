# PowerShell script for deploying docs on Windows

Write-Host "Starting documentation deployment..." -ForegroundColor Green

# Ensure we have the latest dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Make sure React versions are compatible
Write-Host "Ensuring React compatibility..." -ForegroundColor Yellow
npm install react@18.2.0 react-dom@18.2.0 --legacy-peer-deps

# Remove the broken GIF if it exists
if (Test-Path "static/img/web3fuzzforge-quickstart.gif") {
    Write-Host "Removing placeholder GIF file..." -ForegroundColor Yellow
    Remove-Item "static/img/web3fuzzforge-quickstart.gif"
}

# Build the site
Write-Host "Building documentation site..." -ForegroundColor Yellow
npm run build

# Deploy using GitHub Pages environment variables
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Yellow
$env:GIT_USER = git config user.name
$env:CURRENT_BRANCH = "main"
$env:USE_SSH = "true"
npm run deploy

Write-Host "Deployment complete! Your site should be available at https://docs.web3fuzzforge.dev soon." -ForegroundColor Green
Write-Host ""
Write-Host "If you're using GitHub Pages with a custom domain, ensure your CNAME file is configured correctly." -ForegroundColor Cyan 