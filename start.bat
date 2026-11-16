@echo off
title ColdMail Studio
echo ===================================================
echo           ColdMail Studio - Quick Launcher
echo ===================================================
echo.

if not exist node_modules (
    echo [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies.
        pause
        exit /b %errorlevel%
    )
)

if not exist dist (
    echo [2/3] Building application...
    call npm run build
    if errorlevel 1 (
        echo Error building application.
        pause
        exit /b %errorlevel%
    )
)

echo [3/3] Starting ColdMail Studio...
call npm start
pause
