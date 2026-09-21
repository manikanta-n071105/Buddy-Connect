# Migration Script: Neon DB to Local PostgreSQL
$NEON_URL = "postgresql://neondb_owner:npg_ai4wMdNJPFu3@ep-still-rain-ay8715d1.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
$DUMP_FILE = "neon_full_dump.sql"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MIGRATING ALL DATA FROM NEON TO LOCAL DB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "1. Exporting all tables, sequences, and data from Neon..." -ForegroundColor Yellow
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" "$NEON_URL" --clean --if-exists --no-owner --no-acl -f "$DUMP_FILE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Exported Neon DB to $DUMP_FILE" -ForegroundColor Green
    Write-Host "2. Importing all data into local PostgreSQL database 'juniorconnect'..." -ForegroundColor Yellow
    $env:PGPASSWORD = "Manikanta@340"
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d juniorconnect -f "$DUMP_FILE"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "======================================================" -ForegroundColor Green
        Write-Host "  MIGRATION COMPLETE: All Neon data is now local!  " -ForegroundColor Green
        Write-Host "======================================================" -ForegroundColor Green
    } else {
        Write-Host "Import encountered warnings or partial errors. Check $DUMP_FILE." -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Could not connect to Neon DB." -ForegroundColor Red
    Write-Host "Please unpause/resume your project at console.neon.tech and run this script again." -ForegroundColor Red
}
