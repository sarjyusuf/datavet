#!/bin/bash
# DataVet Service Stop Script for EC2

echo "Stopping DataVet Services..."

# Stop application processes
pkill -f "java -jar.*pet-service" || true
pkill -f "python3 main.py" || true
pkill -f "python3 app.py" || true
pkill -f "node server.js" || true

# Stop infrastructure
sudo systemctl stop kafka || true
sudo systemctl stop zookeeper || true
sudo systemctl stop solr || true

echo "All services stopped."
