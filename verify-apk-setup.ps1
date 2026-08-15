# Kushi Cabs APK Build Setup Verification Script
# Run this to verify your system is ready for APK builds

Write-Host "🔍 Kushi Cabs APK Build Setup Verification" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$checks = @()
$warnings = @()
$errors = @()

# Check 1: Node.js
Write-Host "1️⃣  Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v(\d+)") {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -ge 18) {
            Write-Host "   ✅ Node.js $nodeVersion" -ForegroundColor Green
            $checks += "Node.js"
        } else {
            Write-Host "   ⚠️  Node.js $nodeVersion (recommend v20+)" -ForegroundColor Yellow
            $warnings += "Node.js version is old, upgrade recommended"
        }
    }
} catch {
    Write-Host "   ❌ Node.js not found" -ForegroundColor Red
    $errors += "Node.js is not installed. Install from: https://nodejs.org/"
}

# Check 2: npm
Write-Host "2️⃣  Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    Write-Host "   ✅ npm $npmVersion" -ForegroundColor Green
    $checks += "npm"
} catch {
    Write-Host "   ❌ npm not found" -ForegroundColor Red
    $errors += "npm is not installed (usually comes with Node.js)"
}

# Check 3: Expo CLI
Write-Host "3️⃣  Checking Expo CLI..." -ForegroundColor Yellow
try {
    $expoVersion = expo --version 2>&1
    Write-Host "   ✅ Expo CLI $expoVersion" -ForegroundColor Green
    $checks += "Expo CLI"
} catch {
    Write-Host "   ❌ Expo CLI not found" -ForegroundColor Red
    $errors += "Expo CLI not installed. Run: npm install -g expo-cli"
}

# Check 4: EAS CLI
Write-Host "4️⃣  Checking EAS CLI..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1
    Write-Host "   ✅ EAS CLI $easVersion" -ForegroundColor Green
    $checks += "EAS CLI"
} catch {
    Write-Host "   ❌ EAS CLI not found" -ForegroundColor Red
    $errors += "EAS CLI not installed. Run: npm install -g eas-cli"
}

# Check 5: Project directory
Write-Host "5️⃣  Checking project directory..." -ForegroundColor Yellow
$projectPath = "c:\Newfolder\Kushi\Kushi-Cabs-master\newtaxi\apps\unified"
if (Test-Path $projectPath) {
    Write-Host "   ✅ Project directory found" -ForegroundColor Green
    $checks += "Project directory"
} else {
    Write-Host "   ❌ Project directory not found at: $projectPath" -ForegroundColor Red
    $errors += "Project directory missing"
}

# Check 6: Package.json
Write-Host "6️⃣  Checking package.json..." -ForegroundColor Yellow
$packageJsonPath = "$projectPath\package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "   ✅ package.json found" -ForegroundColor Green
    $checks += "package.json"
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
    $errors += "package.json missing in project"
}

# Check 7: .env file
Write-Host "7️⃣  Checking .env file..." -ForegroundColor Yellow
$envPath = "$projectPath\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $hasSupabaseUrl = $envContent -match "EXPO_PUBLIC_SUPABASE_URL"
    $hasSupabaseKey = $envContent -match "EXPO_PUBLIC_SUPABASE_ANON_KEY"
    $hasMapsKey = $envContent -match "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
    
    if ($hasSupabaseUrl -and $hasSupabaseKey -and $hasMapsKey) {
        Write-Host "   ✅ .env file configured" -ForegroundColor Green
        $checks += ".env file"
    } else {
        Write-Host "   ⚠️  .env file exists but missing some variables" -ForegroundColor Yellow
        if (-not $hasSupabaseUrl) { $warnings += ".env missing EXPO_PUBLIC_SUPABASE_URL" }
        if (-not $hasSupabaseKey) { $warnings += ".env missing EXPO_PUBLIC_SUPABASE_ANON_KEY" }
        if (-not $hasMapsKey) { $warnings += ".env missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" }
    }
} else {
    Write-Host "   ⚠️  .env file not found (might use defaults)" -ForegroundColor Yellow
    $warnings += ".env file not found (app.json and eas.json might have defaults)"
}

# Check 8: app.json
Write-Host "8️⃣  Checking app.json..." -ForegroundColor Yellow
$appJsonPath = "$projectPath\app.json"
if (Test-Path $appJsonPath) {
    Write-Host "   ✅ app.json found" -ForegroundColor Green
    $checks += "app.json"
} else {
    Write-Host "   ❌ app.json not found" -ForegroundColor Red
    $errors += "app.json missing (required for Expo builds)"
}

# Check 9: eas.json
Write-Host "9️⃣  Checking eas.json..." -ForegroundColor Yellow
$easJsonPath = "$projectPath\eas.json"
if (Test-Path $easJsonPath) {
    Write-Host "   ✅ eas.json found" -ForegroundColor Green
    $checks += "eas.json"
} else {
    Write-Host "   ❌ eas.json not found" -ForegroundColor Red
    $errors += "eas.json missing (required for EAS builds)"
}

# Check 10: node_modules
Write-Host "🔟 Checking node_modules..." -ForegroundColor Yellow
$nodeModulesPath = "$projectPath\node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    $checks += "node_modules"
} else {
    Write-Host "   ⚠️  node_modules not found (you'll need to run: npm install)" -ForegroundColor Yellow
    $warnings += "Run 'npm install' in the project directory"
}

# Check 11: Disk space
Write-Host "1️⃣1️⃣  Checking disk space..." -ForegroundColor Yellow
$diskInfo = Get-Volume | Where-Object { $_.DriveLetter -eq "C" }
$freeGB = [math]::Round($diskInfo.SizeRemaining / 1GB)
if ($freeGB -gt 20) {
    Write-Host "   ✅ Sufficient disk space ($freeGB GB free)" -ForegroundColor Green
    $checks += "Disk space"
} else {
    Write-Host "   ⚠️  Low disk space ($freeGB GB free, recommend 20+ GB)" -ForegroundColor Yellow
    $warnings += "Low disk space - builds may fail"
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Passed Checks: $($checks.Count)" -ForegroundColor Green
foreach ($check in $checks) {
    Write-Host "   • $check" -ForegroundColor Green
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warnings: $($warnings.Count)" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Errors: $($errors.Count)" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
}

# Final Status
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 READY TO BUILD APK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. cd `"$projectPath`"" -ForegroundColor Green
    Write-Host "2. eas login" -ForegroundColor Green
    Write-Host "3. eas build --platform android --profile production" -ForegroundColor Green
} elseif ($errors.Count -eq 0) {
    Write-Host "✅ READY TO BUILD (with warnings)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Address warnings above for optimal results:" -ForegroundColor Yellow
    Write-Host "1. cd `"$projectPath`"" -ForegroundColor Yellow
    Write-Host "2. npm install (if needed)" -ForegroundColor Yellow
    Write-Host "3. eas login" -ForegroundColor Yellow
    Write-Host "4. eas build --platform android --profile production" -ForegroundColor Yellow
} else {
    Write-Host "❌ NOT READY - FIX ERRORS FIRST" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the errors above, then run this script again:" -ForegroundColor Red
    Write-Host ".\verify-apk-setup.ps1" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Additional commands for setup
if ($errors.Count -gt 0) {
    Write-Host "💡 Quick Fix Commands:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($errors -contains "Expo CLI not installed. Run: npm install -g expo-cli") {
        Write-Host "npm install -g expo-cli" -ForegroundColor White
    }
    
    if ($errors -contains "EAS CLI not installed. Run: npm install -g eas-cli") {
        Write-Host "npm install -g eas-cli" -ForegroundColor White
    }
    
    if ($warnings -match "npm install") {
        Write-Host "cd `"$projectPath`"" -ForegroundColor White
        Write-Host "npm install" -ForegroundColor White
    }
}

Write-Host ""
