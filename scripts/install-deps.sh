#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║   🔧 DATAVET DEPENDENCY INSTALLER 🔧                           ║
# ╚════════════════════════════════════════════════════════════════╝

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎮 DATAVET - INSTALLING DEPENDENCIES 🎮                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${YELLOW}⚠️  npm not found. Please install npm${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${YELLOW}⚠️  Python3 not found. Please install Python 3.9+${NC}"
    exit 1
fi

if ! command_exists java; then
    echo -e "${YELLOW}⚠️  Java not found. Please install Java 17+${NC}"
    exit 1
fi

if ! command_exists mvn; then
    echo -e "${YELLOW}⚠️  Maven not found. Please install Maven${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found!${NC}"
echo ""

# Install Frontend dependencies
echo "📦 Installing Frontend Service dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Install Notification Service dependencies
echo "📦 Installing Notification Service dependencies..."
cd "$PROJECT_ROOT/notification-service"
npm install
echo -e "${GREEN}✅ Notification Service dependencies installed${NC}"
echo ""

# Install Appointment Service dependencies
echo "📦 Installing Appointment Service dependencies..."
cd "$PROJECT_ROOT/appointment-service"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt
echo -e "${GREEN}✅ Appointment Service dependencies installed${NC}"
echo ""

# Install Search Service dependencies
echo "📦 Installing Search Service dependencies..."
cd "$PROJECT_ROOT/search-service"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt
echo -e "${GREEN}✅ Search Service dependencies installed${NC}"
echo ""

# Build Pet Service (Java)
echo "📦 Building Pet Service (Java)..."
cd "$PROJECT_ROOT/pet-service"
mvn clean package -DskipTests
echo -e "${GREEN}✅ Pet Service built${NC}"
echo ""

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎮 ALL DEPENDENCIES INSTALLED SUCCESSFULLY! 🎮               ║
║                                                                ║
║   Next steps:                                                  ║
║   1. Start Kafka and Solr (optional):                          ║
║      ./scripts/start-infra.sh                                  ║
║                                                                ║
║   2. Start all services:                                       ║
║      ./scripts/start-services.sh                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"
