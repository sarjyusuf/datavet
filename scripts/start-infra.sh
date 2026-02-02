#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║   🏗️  DATAVET INFRASTRUCTURE STARTER 🏗️                        ║
# ║   Starts Kafka and Solr locally                                ║
# ╚════════════════════════════════════════════════════════════════╝

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infrastructure"

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🏗️  DATAVET INFRASTRUCTURE SETUP 🏗️                          ║
║                                                                ║
║   This script will help you set up:                            ║
║   - Apache Kafka (message broker)                              ║
║   - Apache Solr (search engine)                                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create infrastructure directory
mkdir -p "$INFRA_DIR"

# ═══════════════════════════════════════════════════════════════
# KAFKA SETUP INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  KAFKA SETUP${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "To install and start Kafka locally:"
echo ""
echo "Option 1: Using Homebrew (macOS):"
echo "  brew install kafka"
echo "  brew services start zookeeper"
echo "  brew services start kafka"
echo ""
echo "Option 2: Manual Download:"
echo "  1. Download from https://kafka.apache.org/downloads"
echo "  2. Extract and run:"
echo "     # Start ZooKeeper"
echo "     bin/zookeeper-server-start.sh config/zookeeper.properties"
echo ""
echo "     # Start Kafka (new terminal)"
echo "     bin/kafka-server-start.sh config/server.properties"
echo ""
echo "Kafka will run on: localhost:9092"
echo ""

# ═══════════════════════════════════════════════════════════════
# SOLR SETUP INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  SOLR SETUP${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "To install and start Solr locally:"
echo ""
echo "Option 1: Using Homebrew (macOS):"
echo "  brew install solr"
echo "  solr start"
echo ""
echo "Option 2: Manual Download:"
echo "  1. Download from https://solr.apache.org/downloads.html"
echo "  2. Extract and run:"
echo "     bin/solr start"
echo ""
echo "Solr Admin UI will be at: http://localhost:8983/solr/"
echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK IF SERVICES ARE RUNNING
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  CHECKING SERVICES${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check Kafka
if nc -z localhost 9092 2>/dev/null; then
    echo -e "${GREEN}✅ Kafka is running on port 9092${NC}"
else
    echo -e "${YELLOW}⚠️  Kafka is NOT running on port 9092${NC}"
    echo "   Services will work without Kafka, but events won't be published."
fi

# Check Solr
if nc -z localhost 8983 2>/dev/null; then
    echo -e "${GREEN}✅ Solr is running on port 8983${NC}"
else
    echo -e "${YELLOW}⚠️  Solr is NOT running on port 8983${NC}"
    echo "   Search service will use in-memory index as fallback."
fi

echo ""
echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   📝 NOTE: Kafka and Solr are OPTIONAL                         ║
║                                                                ║
║   The application will work without them:                      ║
║   - Without Kafka: Events won't be published                   ║
║   - Without Solr: Search uses in-memory index                  ║
║                                                                ║
║   You can start the services now:                              ║
║   ./scripts/start-services.sh                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"
