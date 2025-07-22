@echo off
echo =====================================================
echo Vanit Database Cleanup Script (Windows)
echo =====================================================
echo.

cd /d "%~dp0.."

echo Choose cleanup option:
echo 1. Dry run (preview what will be deleted)
echo 2. Full cleanup (emergency + invoices)
echo 3. Emergency logs only
echo 4. Invoice logs only
echo 5. Custom (specify days)
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Running dry run...
    node scripts/clearLogs.js --dry-run
) else if "%choice%"=="2" (
    echo Running full cleanup...
    node scripts/clearLogs.js
) else if "%choice%"=="3" (
    echo Cleaning emergency logs only...
    node scripts/clearLogs.js --emergency-only
) else if "%choice%"=="4" (
    echo Cleaning invoice logs only...
    node scripts/clearLogs.js --invoices-only
) else if "%choice%"=="5" (
    set /p days="Enter number of days to keep: "
    echo Cleaning records older than %days% days...
    node scripts/clearLogs.js --older-than=%days%
) else if "%choice%"=="6" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Cleanup completed!
pause
