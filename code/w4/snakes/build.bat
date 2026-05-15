@echo off
chcp 65001 >nul
echo ========================================
echo Snake Battle - Build & Package
echo ========================================
echo.

echo [1/3] Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)
echo.

echo [2/3] Building backend...
cd backend
call npm run build
cd ..
if errorlevel 1 (
    echo ERROR: Failed to build backend
    pause
    exit /b 1
)
echo.

echo [3/3] Packaging Electron app...
call npm run electron:build:win
if errorlevel 1 (
    echo ERROR: Failed to package
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build complete!
echo Executable files are in 'release' folder
echo ========================================
pause
