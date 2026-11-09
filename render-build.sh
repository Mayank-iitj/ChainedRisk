#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== [1/3] Building ChainedRisk React Frontend ==="
npm --prefix frontend install
npm --prefix frontend run build

echo "=== [2/3] Installing Python Backend Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== [3/3] Preparing Persistent Data Directory ==="
mkdir -p data

echo "=== Build Completed Successfully ==="
