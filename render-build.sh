#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Installing Python Backend Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Preparing Persistent Data Directory ==="
mkdir -p data

echo "=== Backend Build Completed Successfully ==="
