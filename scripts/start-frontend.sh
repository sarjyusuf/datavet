#!/bin/bash
# Start Frontend Service individually
cd "$(dirname "$0")/../frontend"
echo "🌐 Starting Frontend Service on port 3000..."
npm start
