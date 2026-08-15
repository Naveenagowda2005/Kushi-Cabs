@echo off
REM Upload Documents to Supabase Bucket
REM This script uploads all .md files to your Supabase storage bucket
REM
REM Usage:
REM  upload-documents.bat                          (uses vendor-documents bucket)
REM  upload-documents.bat driver-documents         (uses driver-documents bucket)
REM  upload-documents.bat user-avatars             (uses user-avatars bucket)

setlocal enabledelayedexpansion

REM Set bucket name from parameter or default
if "%1"=="" (
  set BUCKET_NAME=vendor-documents
  echo No bucket specified. Using default: vendor-documents
) else (
  set BUCKET_NAME=%1
  echo Using bucket: %BUCKET_NAME%
)

REM Check if environment variables are set
if "!SUPABASE_URL!"=="" (
  echo.
  echo ERROR: SUPABASE_URL not set!
  echo.
  echo Set environment variables first:
  echo   set SUPABASE_URL=https://your-project.supabase.co
  echo   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  echo.
  echo Then run this script again.
  exit /b 1
)

if "!SUPABASE_SERVICE_ROLE_KEY!"=="" (
  echo.
  echo ERROR: SUPABASE_SERVICE_ROLE_KEY not set!
  echo.
  echo Set environment variables first:
  echo   set SUPABASE_URL=https://your-project.supabase.co
  echo   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  echo.
  echo Then run this script again.
  exit /b 1
)

REM Set the bucket name for the script
set BUCKET_NAME=%BUCKET_NAME%

REM Run the upload script
echo.
echo Starting upload to bucket: %BUCKET_NAME%
echo.

node scripts/upload-documents-to-bucket.js

if errorlevel 1 (
  echo.
  echo Upload completed with errors. Check output above.
  exit /b 1
) else (
  echo.
  echo Upload completed successfully!
  exit /b 0
)
