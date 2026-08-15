@echo off
REM ============================================================
REM Odometer RLS Fix - Quick Run
REM ============================================================
REM This batch file will:
REM 1. Change to project directory
REM 2. Load environment variables
REM 3. Run the fix script via Node.js

cd /d "c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi"

echo.
echo ===== ODOMETER RLS FIX =====
echo.
echo This will fix the "row violates row-level security policy" error
echo when uploading odometer images.
echo.
echo The fix addresses the UUID type mismatch in RLS policies.
echo.

REM Try to run the fix script
if exist "scripts\fix-odometer-rls.js" (
    echo Running fix script...
    call npm run fix-odometer-rls
) else (
    echo Error: fix-odometer-rls.js not found
    exit /b 1
)

echo.
echo ===== NEXT STEPS =====
echo 1. Restart the app if it's running
echo 2. Log in as a driver
echo 3. Try uploading an odometer image
echo.
pause
