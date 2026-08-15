@echo off
REM Start both servers locally
REM Run this file to get started quickly

echo.
echo ========================================
echo   TAXI APP - Local Server Startup
echo ========================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ERROR: backend folder not found!
    echo Make sure you run this from: c:\Users\navee\OneDrive\Desktop\TAXI\
    pause
    exit /b 1
)

if not exist "newtaxi" (
    echo ERROR: newtaxi folder not found!
    echo Make sure you run this from: c:\Users\navee\OneDrive\Desktop\TAXI\
    pause
    exit /b 1
)

echo.
echo IMPORTANT: This script shows you the commands, but you need to run them in separate terminals.
echo.
echo STEP 1: Open Terminal 1 and run:
echo ========================================
echo cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
echo npm start
echo.
echo STEP 2: Open Terminal 2 (in the same location) and run:
echo ========================================
echo cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
echo npm start
echo.
echo STEP 3: When you see the Expo menu, press 'w' for web
echo.
echo STEP 4: Browser will open at http://localhost:8081
echo.
echo ========================================
echo Configuration:
echo - Backend: http://localhost:4000
echo - Frontend: http://localhost:8081
echo - Database: Supabase Cloud
echo ========================================
echo.
echo For detailed instructions, see:
echo - LOCAL_SERVER_STARTUP_GUIDE.md
echo - QUICK_START_LOCAL.md
echo.
pause
