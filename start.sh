#!/usr/bin/env bash
echo "==================================================="
echo "          ColdMail Studio - Quick Launcher"
echo "==================================================="
echo ""

if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    npm install
fi

if [ ! -d "dist" ]; then
    echo "[2/3] Building application..."
    npm run build
fi

echo "[3/3] Starting ColdMail Studio..."
npm start
