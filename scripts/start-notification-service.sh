#!/bin/bash
# Start Notification Service individually
cd "$(dirname "$0")/../notification-service"
echo "🔔 Starting Notification Service on port 3001..."
npm start
