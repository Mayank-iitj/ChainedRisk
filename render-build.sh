#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Installing Python Backend Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

# Install root package in editable mode so 'backend' is universally in sys.path
if [ -f "setup.py" ]; then
    pip install -e .
fi

echo "=== Preparing Persistent Data Directory ==="
mkdir -p data

echo "=== Backend Build Completed Successfully ==="
