# Deployment Verification Script - Simplified English Version
Write-Host "Verifying automated deployment configuration..." -ForegroundColor Green

# Check GitHub Actions configuration file
Write-Host "\nChecking GitHub Actions configuration..."
if (Test-Path '.\.github\workflows\deploy.yml') {
    Write-Host "✅ GitHub Actions configuration file exists" -ForegroundColor Green
    $configContent = Get-Content '.\.github\workflows\deploy.yml' -TotalCount 10
    Write-Host "Configuration preview:"
    $configContent | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "❌ GitHub Actions configuration file does not exist" -ForegroundColor Red
}

# Check deployment scripts
Write-Host "\nChecking deployment scripts..."
if (Test-Path '.\scripts\pre-deploy-check.sh') {
    Write-Host "✅ Pre-deploy check script exists" -ForegroundColor Green
}
if (Test-Path '.\scripts\verify-deployment-en.ps1') {
    Write-Host "✅ Deployment verification script exists" -ForegroundColor Green
}

# Set execution permissions for scripts in Windows
Write-Host "\nSetting script permissions..."
try {
    Unblock-File -Path '.\scripts\pre-deploy-check.sh' -ErrorAction SilentlyContinue
    Unblock-File -Path '.\scripts\verify-deployment-en.ps1' -ErrorAction SilentlyContinue
    Write-Host "✅ Script permissions updated for Windows environment" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not set permissions (administrator privileges may be required)" -ForegroundColor Yellow
}

# Check test scripts
Write-Host "\nChecking test scripts..."
if (Test-Path '.\tests\e2e\app.test.js') {
    Write-Host "✅ End-to-end test script exists" -ForegroundColor Green
}

# Check package.json script configuration
Write-Host "\nChecking package.json configuration..."
try {
    $packageJson = Get-Content '.\package.json' -Raw | ConvertFrom-Json
    if ($packageJson.scripts -and $packageJson.scripts.'pre-deploy') {
        Write-Host "✅ Pre-deploy script command configured" -ForegroundColor Green
    }
    if ($packageJson.scripts -and $packageJson.scripts.'test:e2e') {
        Write-Host "✅ E2E test command configured" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Cannot read package.json" -ForegroundColor Yellow
}

# Check deployment documentation
Write-Host "\nChecking deployment documentation..."
if (Test-Path '.\README_DEPLOY.md') {
    Write-Host "✅ Deployment documentation exists" -ForegroundColor Green
}

Write-Host "\n🎉 Deployment configuration verification complete!" -ForegroundColor Green
Write-Host "\n📝 Deployment Process Summary:" -ForegroundColor Cyan
Write-Host "1. Code push to GitHub will automatically trigger Actions workflow"
Write-Host "2. Workflow will build and deploy to GitHub Pages"
Write-Host "3. Refer to README_DEPLOY.md for detailed configuration steps"
Write-Host "4. Use scripts in the scripts directory for local verification"
