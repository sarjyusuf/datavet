#!/bin/bash
# Start Pet Service individually
cd "$(dirname "$0")/../pet-service"
echo "🐾 Starting Pet Service on port 8080..."

if [ ! -f "target/pet-service-1.0.0.jar" ]; then
    echo "Building Pet Service..."
    mvn clean package -DskipTests
fi

java -jar target/pet-service-1.0.0.jar
