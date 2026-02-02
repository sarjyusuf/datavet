#!/bin/bash
# Start Appointment Service individually
cd "$(dirname "$0")/../appointment-service"
echo "📅 Starting Appointment Service on port 8081..."

if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
fi

python3 main.py
