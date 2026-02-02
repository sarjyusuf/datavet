#!/bin/bash
# DataVet Service Restart Script for EC2
# This will restart all application services to pick up Datadog instrumentation

APP_DIR="/home/ec2-user/DataVet"
LOG_DIR="/home/ec2-user/DataVet/logs"

echo "=========================================="
echo "Restarting DataVet Services"
echo "=========================================="

# Stop application processes
echo ""
echo "[1/6] Stopping application services..."
pkill -f "java -jar.*pet-service" 2>/dev/null || true
pkill -f "python3 main.py" 2>/dev/null || true
pkill -f "python3 app.py" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
sleep 3

echo "  ✓ All application services stopped"

# Ensure log directory exists
mkdir -p $LOG_DIR

# Start Pet Service (Java)
echo ""
echo "[2/6] Starting Pet Service (Java)..."
cd $APP_DIR/pet-service
nohup java -jar target/pet-service-1.0.0.jar > $LOG_DIR/pet-service.log 2>&1 &
sleep 8
echo "  ✓ Pet Service started"

# Start Appointment Service (Python)
echo ""
echo "[3/6] Starting Appointment Service (Python)..."
cd $APP_DIR/appointment-service
nohup python3 main.py > $LOG_DIR/appointment-service.log 2>&1 &
sleep 3
echo "  ✓ Appointment Service started"

# Start Search Service (Python)
echo ""
echo "[4/6] Starting Search Service (Python)..."
cd $APP_DIR/search-service
nohup python3 app.py > $LOG_DIR/search-service.log 2>&1 &
sleep 3
echo "  ✓ Search Service started"

# Start Notification Service (Node.js)
echo ""
echo "[5/6] Starting Notification Service (Node.js)..."
cd $APP_DIR/notification-service
nohup node server.js > $LOG_DIR/notification-service.log 2>&1 &
sleep 2
echo "  ✓ Notification Service started"

# Start Frontend (Node.js)
echo ""
echo "[6/6] Starting Frontend (Node.js)..."
cd $APP_DIR/frontend
nohup node server.js > $LOG_DIR/frontend.log 2>&1 &
sleep 2
echo "  ✓ Frontend started"

echo ""
echo "=========================================="
echo "Service Status"
echo "=========================================="
echo ""
echo "Running processes:"
ps aux | grep -E 'java.*pet-service|python3 main.py|python3 app.py|node server.js' | grep -v grep | awk '{print "  " $11 " " $12}'

echo ""
echo "Listening ports:"
ss -tlnp 2>/dev/null | grep -E '3000|3001|8080|8081|8082' | awk '{print "  " $4}'

echo ""
echo "=========================================="
echo "All services restarted!"
echo "=========================================="
echo ""
echo "Logs: $LOG_DIR/"
echo "App:  http://3.142.198.53:3000"
