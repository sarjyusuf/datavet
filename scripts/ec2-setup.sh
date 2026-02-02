#!/bin/bash
# DataVet EC2 Setup Script for Amazon Linux 2023
set -e

echo "=========================================="
echo "DataVet EC2 Setup - Amazon Linux 2023"
echo "=========================================="

# Update system
echo "[1/7] Updating system packages..."
sudo dnf update -y

# Install Java 17
echo "[2/7] Installing Java 17..."
sudo dnf install -y java-17-amazon-corretto-devel
java -version

# Install Node.js 18
echo "[3/7] Installing Node.js 18..."
sudo dnf install -y nodejs npm
node --version
npm --version

# Install Python dependencies
echo "[4/7] Installing Python packages..."
sudo dnf install -y python3-pip python3-devel
pip3 install --user fastapi uvicorn pydantic python-dateutil kafka-python sqlalchemy aiosqlite flask flask-cors pysolr requests

# Install and setup Kafka
echo "[5/7] Installing Kafka..."
cd /opt
sudo wget -q https://archive.apache.org/dist/kafka/3.6.1/kafka_2.13-3.6.1.tgz
sudo tar -xzf kafka_2.13-3.6.1.tgz
sudo mv kafka_2.13-3.6.1 kafka
sudo rm kafka_2.13-3.6.1.tgz

# Create Kafka systemd services
sudo tee /etc/systemd/system/zookeeper.service > /dev/null <<EOF
[Unit]
Description=Apache Zookeeper
After=network.target

[Service]
Type=simple
User=ec2-user
ExecStart=/opt/kafka/bin/zookeeper-server-start.sh /opt/kafka/config/zookeeper.properties
ExecStop=/opt/kafka/bin/zookeeper-server-stop.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/kafka.service > /dev/null <<EOF
[Unit]
Description=Apache Kafka
After=zookeeper.service
Requires=zookeeper.service

[Service]
Type=simple
User=ec2-user
ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/server.properties
ExecStop=/opt/kafka/bin/kafka-server-stop.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Install and setup Solr
echo "[6/7] Installing Solr..."
cd /opt
sudo wget -q https://archive.apache.org/dist/solr/solr/9.4.0/solr-9.4.0.tgz
sudo tar -xzf solr-9.4.0.tgz
sudo mv solr-9.4.0 solr
sudo rm solr-9.4.0.tgz
sudo chown -R ec2-user:ec2-user /opt/solr

# Create Solr systemd service
sudo tee /etc/systemd/system/solr.service > /dev/null <<EOF
[Unit]
Description=Apache Solr
After=network.target

[Service]
Type=forking
User=ec2-user
ExecStart=/opt/solr/bin/solr start
ExecStop=/opt/solr/bin/solr stop
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Set permissions for Kafka
sudo chown -R ec2-user:ec2-user /opt/kafka

# Reload systemd
sudo systemctl daemon-reload

echo "[7/7] Setup complete!"
echo ""
echo "Installed versions:"
echo "  Java:   $(java -version 2>&1 | head -1)"
echo "  Node:   $(node --version)"
echo "  Python: $(python3 --version)"
echo "  Kafka:  3.6.1"
echo "  Solr:   9.4.0"
