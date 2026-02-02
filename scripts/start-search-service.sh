#!/bin/bash
# Start Search Service individually
cd "$(dirname "$0")/../search-service"
echo "🔍 Starting Search Service on port 8082..."

if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
fi

python3 app.py
