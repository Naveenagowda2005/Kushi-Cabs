# ============================================================
# 🚀 TAXI APP - LOCAL DEVELOPMENT RESTART SCRIPT
# Terminate and restart Backend + Frontend with local IP
# ============================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TAXI APP - LOCAL DEVELOPMENT RESTART                ║" -ForegroundColor Cyan
Write-Host "║   Backend: http://192.168.1.109:4000                 ║" -ForegroundColor Cyan
Write-Host "║   Frontend: Expo (Local)                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Step 1: Terminate Backend (Node.js)
# ============================================================
Write-Host "Step 1️⃣  Terminating Backend Services..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

$backendProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($backendProcesses) {
    Write-Host "  🔴 Found Node.js processes: $($backendProcesses.Count)" -ForegroundColor Red
    Write-Host "  ⏳ Killing processes..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "  ✅ Backend processes terminated" -ForegroundColor Green
} else {
    Write-Host "  ✅ No backend processes running" -ForegroundColor Green
}

# ============================================================
# Step 2: Terminate Frontend (Expo/npm)
# ============================================================
Write-Host ""
Write-Host "Step 2️⃣  Terminating Frontend Services..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

$expoProcesses = Get-Process expo -ErrorAction SilentlyContinue
$npmProcesses = Get-Process npm -ErrorAction SilentlyContinue

$killed = $false

if ($expoProcesses) {
    Write-Host "  🔴 Found Expo processes: $($expoProcesses.Count)" -ForegroundColor Red
    Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force
    $killed = $true
}

if ($npmProcesses) {
    Write-Host "  🔴 Found npm processes: $($npmProcesses.Count)" -ForegroundColor Red
    Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force
    $killed = $true
}

if ($killed) {
    Write-Host "  ✅ Frontend processes terminated" -ForegroundColor Green
} else {
    Write-Host "  ✅ No frontend processes running" -ForegroundColor Green
}

# ============================================================
# Step 3: Wait for cleanup
# ============================================================
Write-Host ""
Write-Host "Step 3️⃣  Waiting for cleanup..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  ⏳ Waiting 3 seconds..." -ForegroundColor Cyan

for ($i = 3; $i -gt 0; $i--) {
    Write-Host "  ⏱️  $i..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}

Write-Host "  ✅ Ready to restart" -ForegroundColor Green

# ============================================================
# Step 4: Start Backend
# ============================================================
Write-Host ""
Write-Host "Step 4️⃣  Starting Backend Server..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

$backendPath = "C:\Users\navee\OneDrive\Desktop\TAXI\backend"
Write-Host "  📂 Backend path: $backendPath" -ForegroundColor Cyan
Write-Host "  🌐 Listening on: http://192.168.1.109:4000" -ForegroundColor Cyan

# Start backend in new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; node index.js" -WindowStyle Normal

Write-Host "  ✅ Backend started (check new window)" -ForegroundColor Green
Start-Sleep -Seconds 3

# ============================================================
# Step 5: Start Frontend
# ============================================================
Write-Host ""
Write-Host "Step 5️⃣  Starting Frontend (Expo)..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

$frontendPath = "C:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified"
Write-Host "  📂 Frontend path: $frontendPath" -ForegroundColor Cyan
Write-Host "  📱 Expo will start in new window" -ForegroundColor Cyan

# Start frontend in new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal

Write-Host "  ✅ Frontend started (check new window)" -ForegroundColor Green

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ SERVICES STARTED SUCCESSFULLY                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "📍 Services Running:" -ForegroundColor Cyan
Write-Host "   Backend:  http://192.168.1.109:4000" -ForegroundColor Green
Write-Host "   Frontend: Expo (Local)" -ForegroundColor Green
Write-Host ""

Write-Host "📱 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open Expo Go app on mobile device" -ForegroundColor White
Write-Host "   2. Scan QR code from frontend terminal window" -ForegroundColor White
Write-Host "   3. App will connect to local backend" -ForegroundColor White
Write-Host "   4. Watch backend terminal for API requests" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Connection Check:" -ForegroundColor Yellow
Write-Host "   Run: curl http://192.168.1.109:4000/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Important:" -ForegroundColor Red
Write-Host "   • Keep both terminal windows open while developing" -ForegroundColor White
Write-Host "   • Mobile device must be on same WiFi as PC" -ForegroundColor White
Write-Host "   • IP must match your local network (192.168.1.109)" -ForegroundColor White
Write-Host ""

Write-Host "🛑 To Stop:" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C in each terminal window" -ForegroundColor Cyan
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
