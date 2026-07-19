# Upload Documents to Supabase Bucket
# PowerShell script to upload all .md files to your Supabase storage bucket
#
# Usage:
#   .\upload-documents.ps1                          # uses vendor-documents bucket
#   .\upload-documents.ps1 -Bucket driver-documents # uses driver-documents bucket
#   .\upload-documents.ps1 -Bucket user-avatars     # uses user-avatars bucket
#
# Before running, set environment variables:
#   $env:SUPABASE_URL = "https://your-project.supabase.co"
#   $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"

param(
    [string]$Bucket = "vendor-documents"
)

# Set environment variable for bucket
$env:BUCKET_NAME = $Bucket
Write-Host "Using bucket: $Bucket" -ForegroundColor Cyan

# Validate environment variables
if ([string]::IsNullOrEmpty($env:SUPABASE_URL)) {
    Write-Host ""
    Write-Host "ERROR: SUPABASE_URL not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set environment variables first:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_URL = "https://your-project.supabase.co"' -ForegroundColor Gray
    Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"' -ForegroundColor Gray
    Write-Host ""
    exit 1
}

if ([string]::IsNullOrEmpty($env:SUPABASE_SERVICE_ROLE_KEY)) {
    Write-Host ""
    Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set environment variables first:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_URL = "https://your-project.supabase.co"' -ForegroundColor Gray
    Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"' -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Starting upload to bucket: $Bucket" -ForegroundColor Green
Write-Host ""

# Run the Node.js script
node scripts/upload-documents-to-bucket.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Upload completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Upload completed with errors. Check output above." -ForegroundColor Yellow
    exit 1
}
