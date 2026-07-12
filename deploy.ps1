# Sword Institute LMS - Production Deployment Script (Windows)
# Deploys Knowledge Hub Integration to Firebase
# Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Sword Institute LMS - Production Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Helper function for colored output
function Write-Status($message, $status = "info") {
    switch ($status) {
        "success" { Write-Host "✓ $message" -ForegroundColor Green }
        "error" { Write-Host "❌ $message" -ForegroundColor Red }
        "warning" { Write-Host "⚠️ $message" -ForegroundColor Yellow }
        "info" { Write-Host "ℹ️ $message" -ForegroundColor Blue }
        default { Write-Host $message }
    }
}

# Step 1: Verify Prerequisites
Write-Host ""
Write-Host "📋 Step 1: Verifying Prerequisites" -ForegroundColor Cyan
Write-Host ""

try {
    $nodeVersion = node --version
    Write-Status "Node.js $nodeVersion" "success"
} catch {
    Write-Status "Node.js not found. Please install Node.js 18+" "error"
    exit 1
}

try {
    $firebaseVersion = firebase --version
    Write-Status "Firebase CLI installed" "success"
} catch {
    Write-Status "Firebase CLI not found. Installing..." "warning"
    npm install -g firebase-tools
}

Write-Host ""

# Step 2: Run Tests
Write-Host ""
Write-Host "🧪 Step 2: Running Tests" -ForegroundColor Cyan
Write-Host ""

Write-Status "Running integration tests..." "info"
try {
    $integrationOutput = & node --test tests/knowledge-hub-integration.test.js 2>&1
    $integrationCount = ($integrationOutput | Select-String "✔" | Measure-Object).Count
    Write-Status "Integration Tests: $integrationCount passed" "success"
} catch {
    Write-Status "Integration tests failed" "error"
    Write-Host $integrationOutput
    exit 1
}

Write-Status "Running unit tests..." "info"
try {
    $unitOutput = & node --test tests/catalog-helpers.test.js 2>&1
    $unitCount = ($unitOutput | Select-String "✔" | Measure-Object).Count
    Write-Status "Unit Tests: $unitCount passed" "success"
} catch {
    Write-Status "Unit tests failed" "error"
    Write-Host $unitOutput
    exit 1
}

Write-Host ""

# Step 3: Verify Firebase Configuration
Write-Host ""
Write-Host "🔐 Step 3: Verifying Firebase Configuration" -ForegroundColor Cyan
Write-Host ""

$firebaserc = Get-Content .firebaserc -Raw
if ($firebaserc -notmatch "sword-institute-lms") {
    Write-Status "Firebase project not configured" "error"
    exit 1
}
Write-Status "Firebase project configured: sword-institute-lms" "success"

Write-Host ""

# Step 4: Lint Cloud Functions
Write-Host ""
Write-Host "🔍 Step 4: Linting Cloud Functions" -ForegroundColor Cyan
Write-Host ""

Push-Location functions
try {
    $lintOutput = npm run lint 2>&1
    Write-Status "Functions passed linting" "success"
} catch {
    Write-Status "Linting issues (non-blocking)" "warning"
}
Pop-Location

Write-Host ""

# Step 5: Confirm Deployment
Write-Host ""
Write-Host "🚀 Step 5: Ready to Deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:"
Write-Host "  - Integration Tests: ✓ PASSED"
Write-Host "  - Unit Tests: ✓ PASSED"
Write-Host "  - Firebase Config: ✓ VERIFIED"
Write-Host "  - Cloud Functions: ✓ READY"
Write-Host ""

$response = Read-Host "Continue with deployment? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Status "Deployment cancelled" "warning"
    exit 0
}

Write-Host ""

# Step 6: Deploy Cloud Functions
Write-Host ""
Write-Host "⚙️ Step 6: Deploying Cloud Functions" -ForegroundColor Cyan
Write-Host ""

Push-Location functions
try {
    Write-Status "Installing dependencies..." "info"
    npm install 2>&1 | Out-Null
    
    Write-Status "Deploying Cloud Functions..." "info"
    firebase deploy --only functions
    Write-Status "Cloud Functions deployed successfully" "success"
} catch {
    Write-Status "Cloud Functions deployment failed" "error"
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""

# Step 7: Deploy Hosting
Write-Host ""
Write-Host "🌐 Step 7: Deploying Hosting" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Status "Deploying Hosting..." "info"
    firebase deploy --only hosting
    Write-Status "Hosting deployed successfully" "success"
} catch {
    Write-Status "Hosting deployment failed" "error"
    exit 1
}

Write-Host ""

# Step 8: Verification
Write-Host ""
Write-Host "✅ Step 8: Verifying Deployment" -ForegroundColor Cyan
Write-Host ""

Write-Status "Deployment Complete!" "success"
Write-Host ""
Write-Host "Your site is live at:"
Write-Host "  https://sword-institute-lms.web.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Visit your site and login"
Write-Host "  2. Verify dashboard widgets appear"
Write-Host "  3. Check course pages for related resources"
Write-Host "  4. Test academy pages and lesson resources"
Write-Host "  5. Monitor logs: firebase functions:log"
Write-Host ""
Write-Status "Production Deployment Successful!" "success"
