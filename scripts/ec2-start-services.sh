#!/bin/bash
# DataVet Service Startup Script for EC2
set -e

APP_DIR="/home/ec2-user/DataVet"
LOG_DIR="/home/ec2-user/DataVet/logs"

mkdir -p $LOG_DIR

echo "=========================================="
echo "Starting DataVet Services"
echo "=========================================="

# Start infrastructure
echo "[1/7] Starting Zookeeper..."
sudo systemctl start zookeeper
sleep 5

echo "[2/7] Starting Kafka..."
sudo systemctl start kafka
sleep 5

echo "[3/7] Starting Solr..."
sudo systemctl start solr
sleep 5

# Create Kafka topics
echo "[4/7] Creating Kafka topics..."
/opt/kafka/bin/kafka-topics.sh --create --topic pet-events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists
/opt/kafka/bin/kafka-topics.sh --create --topic appointment-events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists

# Create Solr cores
echo "[5/7] Creating Solr cores..."
/opt/solr/bin/solr create -c datavet_pets -p 8983 || true
/opt/solr/bin/solr create -c datavet_appointments -p 8983 || true

# Start Pet Service (Java)
echo "[6/7] Starting Pet Service..."
cd $APP_DIR/pet-service
nohup java -jar target/pet-service-1.0.0.jar > $LOG_DIR/pet-service.log 2>&1 &
sleep 10

# Start Appointment Service (Python)
echo "[7/7] Starting Appointment Service..."
cd $APP_DIR/appointment-service
nohup python3 main.py > $LOG_DIR/appointment-service.log 2>&1 &
sleep 3

# Start Search Service (Python)
echo "[8/7] Starting Search Service..."
cd $APP_DIR/search-service
nohup python3 app.py > $LOG_DIR/search-service.log 2>&1 &
sleep 3

# Start Notification Service (Node.js)
echo "[9/7] Starting Notification Service..."
cd $APP_DIR/notification-service
npm install --production
nohup node server.js > $LOG_DIR/notification-service.log 2>&1 &
sleep 3

# Start Frontend (Node.js)
echo "[10/7] Starting Frontend..."
cd $APP_DIR/frontend
npm install --production
nohup node server.js > $LOG_DIR/frontend.log 2>&1 &
sleep 3

echo ""
echo "=========================================="
echo "All services started!"
echo "=========================================="
echo ""
echo "Service Status:"
echo "  Zookeeper:    $(sudo systemctl is-active zookeeper)"
echo "  Kafka:        $(sudo systemctl is-active kafka)"
echo "  Solr:         $(sudo systemctl is-active solr)"
echo ""
echo "Application Logs: $LOG_DIR/"
echo ""
echo "Access the application at:"
echo "  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
