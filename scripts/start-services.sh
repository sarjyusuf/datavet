#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║   🚀 DATAVET SERVICES STARTER 🚀                               ║
# ║   Starts all microservices                                     ║
# ╚════════════════════════════════════════════════════════════════╝

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOGS_DIR"

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎮 DATAVET - STARTING ALL SERVICES 🎮                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Trap to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    pkill -f "pet-service" 2>/dev/null || true
    pkill -f "appointment-service" 2>/dev/null || true
    pkill -f "search-service" 2>/dev/null || true
    pkill -f "notification-service" 2>/dev/null || true
    pkill -f "datavet-frontend" 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ═══════════════════════════════════════════════════════════════
# START PET SERVICE (Java - Port 8080)
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}Starting Pet Service (Java/Spring Boot) on port 8080...${NC}"
cd "$PROJECT_ROOT/pet-service"

if [ -f "target/pet-service-1.0.0.jar" ]; then
    java -jar target/pet-service-1.0.0.jar > "$LOGS_DIR/pet-service.log" 2>&1 &
    PET_PID=$!
    echo -e "${GREEN}✅ Pet Service started (PID: $PET_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Pet Service JAR not found. Building...${NC}"
    mvn clean package -DskipTests -q
    java -jar target/pet-service-1.0.0.jar > "$LOGS_DIR/pet-service.log" 2>&1 &
    PET_PID=$!
    echo -e "${GREEN}✅ Pet Service started (PID: $PET_PID)${NC}"
fi

# Wait for Pet Service to be ready
echo "   Waiting for Pet Service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/pets/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}Pet Service is ready!${NC}"
        break
    fi
    sleep 1
done

# ═══════════════════════════════════════════════════════════════
# START APPOINTMENT SERVICE (Python - Port 8081)
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}Starting Appointment Service (Python/FastAPI) on port 8081...${NC}"
cd "$PROJECT_ROOT/appointment-service"

# Activate virtual environment and start
if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
fi
python3 main.py > "$LOGS_DIR/appointment-service.log" 2>&1 &
APPT_PID=$!
echo -e "${GREEN}✅ Appointment Service started (PID: $APPT_PID)${NC}"

# Wait for Appointment Service to be ready
echo "   Waiting for Appointment Service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}Appointment Service is ready!${NC}"
        break
    fi
    sleep 1
done

# ═══════════════════════════════════════════════════════════════
# START SEARCH SERVICE (Python - Port 8082)
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}Starting Search Service (Python/Flask) on port 8082...${NC}"
cd "$PROJECT_ROOT/search-service"

if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
fi
python3 app.py > "$LOGS_DIR/search-service.log" 2>&1 &
SEARCH_PID=$!
echo -e "${GREEN}✅ Search Service started (PID: $SEARCH_PID)${NC}"

# Wait for Search Service to be ready
echo "   Waiting for Search Service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8082/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}Search Service is ready!${NC}"
        break
    fi
    sleep 1
done

# ═══════════════════════════════════════════════════════════════
# START NOTIFICATION SERVICE (Node.js - Port 3001)
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}Starting Notification Service (Node.js) on port 3001...${NC}"
cd "$PROJECT_ROOT/notification-service"
npm start > "$LOGS_DIR/notification-service.log" 2>&1 &
NOTIF_PID=$!
echo -e "${GREEN}✅ Notification Service started (PID: $NOTIF_PID)${NC}"

# Wait for Notification Service to be ready
echo "   Waiting for Notification Service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}Notification Service is ready!${NC}"
        break
    fi
    sleep 1
done

# ═══════════════════════════════════════════════════════════════
# START FRONTEND SERVICE (Node.js - Port 3000)
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}Starting Frontend Service (Node.js) on port 3000...${NC}"
cd "$PROJECT_ROOT/frontend"
npm start > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend Service started (PID: $FRONTEND_PID)${NC}"

# Wait for Frontend Service to be ready
echo "   Waiting for Frontend Service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}Frontend Service is ready!${NC}"
        break
    fi
    sleep 1
done

# ═══════════════════════════════════════════════════════════════
# DISPLAY STATUS
# ═══════════════════════════════════════════════════════════════

echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎮 ALL SERVICES STARTED! 🎮                                  ║
║                                                                ║
║   ┌────────────────────────────────────────────────────────┐   ║
║   │ SERVICE              │ PORT  │ URL                     │   ║
║   ├────────────────────────────────────────────────────────┤   ║
║   │ 🌐 Frontend          │ 3000  │ http://localhost:3000   │   ║
║   │ 🐾 Pet Service       │ 8080  │ http://localhost:8080   │   ║
║   │ 📅 Appointment       │ 8081  │ http://localhost:8081   │   ║
║   │ 🔍 Search            │ 8082  │ http://localhost:8082   │   ║
║   │ 🔔 Notifications     │ 3001  │ http://localhost:3001   │   ║
║   └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║   📝 Logs are in: $PROJECT_ROOT/logs/               ║
║                                                                ║
║   Press Ctrl+C to stop all services                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🎮 Open http://localhost:3000 in your browser to play!

"

# Keep script running
wait
