#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║   🛑 DATAVET SERVICES STOPPER 🛑                               ║
# ╚════════════════════════════════════════════════════════════════╝

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🛑 STOPPING ALL DATAVET SERVICES 🛑                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop services by port
echo "Stopping services..."

# Frontend (3000)
if lsof -ti:3000 > /dev/null 2>&1; then
    kill $(lsof -ti:3000) 2>/dev/null
    echo -e "${GREEN}✅ Frontend service stopped (port 3000)${NC}"
fi

# Notification Service (3001)
if lsof -ti:3001 > /dev/null 2>&1; then
    kill $(lsof -ti:3001) 2>/dev/null
    echo -e "${GREEN}✅ Notification service stopped (port 3001)${NC}"
fi

# Pet Service (8080)
if lsof -ti:8080 > /dev/null 2>&1; then
    kill $(lsof -ti:8080) 2>/dev/null
    echo -e "${GREEN}✅ Pet service stopped (port 8080)${NC}"
fi

# Appointment Service (8081)
if lsof -ti:8081 > /dev/null 2>&1; then
    kill $(lsof -ti:8081) 2>/dev/null
    echo -e "${GREEN}✅ Appointment service stopped (port 8081)${NC}"
fi

# Search Service (8082)
if lsof -ti:8082 > /dev/null 2>&1; then
    kill $(lsof -ti:8082) 2>/dev/null
    echo -e "${GREEN}✅ Search service stopped (port 8082)${NC}"
fi

# Also try to kill by process name
pkill -f "pet-service" 2>/dev/null || true
pkill -f "appointment-service" 2>/dev/null || true
pkill -f "search-service" 2>/dev/null || true
pkill -f "notification-service" 2>/dev/null || true
pkill -f "datavet-frontend" 2>/dev/null || true

echo "
╔════════════════════════════════════════════════════════════════╗
║   🎮 ALL SERVICES STOPPED - GAME OVER! 🎮                      ║
╚════════════════════════════════════════════════════════════════╝
"
