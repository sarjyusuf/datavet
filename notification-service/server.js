/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║   🔔 DATAVET NOTIFICATION SERVICE 🔔                           ║
 * ║   Kafka consumer for real-time notifications                   ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

const express = require('express');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');

// Middleware
app.use(cors());
app.use(express.json());

// In-memory notification store
const notifications = [];
const MAX_NOTIFICATIONS = 100;

// WebSocket clients
const wsClients = new Set();

// ═══════════════════════════════════════════════════════════════
// KAFKA SETUP
// ═══════════════════════════════════════════════════════════════

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000,
    retries: 5
  }
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

let kafkaConnected = false;

async function connectKafka() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['pet-events', 'appointment-events', 'notifications'], fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`📨 Received event from ${topic}:`, event.eventType);
          
          const notification = processEvent(topic, event);
          if (notification) {
            addNotification(notification);
            broadcastToClients(notification);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    });
    
    kafkaConnected = true;
    console.log('✅ Kafka consumer connected successfully');
  } catch (error) {
    console.warn('⚠️ Kafka connection failed:', error.message);
    console.log('   Service will continue without Kafka...');
    kafkaConnected = false;
  }
}

function processEvent(topic, event) {
  const timestamp = new Date().toISOString();
  
  switch (event.eventType) {
    // Pet events
    case 'PET_CREATED':
      return {
        id: uuidv4(),
        type: 'success',
        icon: '🐾',
        title: 'New Pet Registered',
        message: `${event.petName} (${event.species}) has been registered!`,
        timestamp,
        data: event
      };
    
    case 'PET_UPDATED':
      return {
        id: uuidv4(),
        type: 'info',
        icon: '📝',
        title: 'Pet Updated',
        message: `${event.petName}'s information has been updated.`,
        timestamp,
        data: event
      };
    
    case 'PET_DELETED':
      return {
        id: uuidv4(),
        type: 'warning',
        icon: '🗑️',
        title: 'Pet Removed',
        message: `Pet #${event.petId} has been removed from the system.`,
        timestamp,
        data: event
      };
    
    // Appointment events
    case 'APPOINTMENT_CREATED':
      return {
        id: uuidv4(),
        type: 'success',
        icon: '📅',
        title: 'Appointment Scheduled',
        message: `New ${event.type} appointment booked for ${event.date} at ${event.time}`,
        timestamp,
        data: event
      };
    
    case 'APPOINTMENT_UPDATED':
      return {
        id: uuidv4(),
        type: 'info',
        icon: '🔄',
        title: 'Appointment Updated',
        message: `Appointment #${event.appointmentId} has been modified.`,
        timestamp,
        data: event
      };
    
    case 'APPOINTMENT_DELETED':
      return {
        id: uuidv4(),
        type: 'warning',
        icon: '❌',
        title: 'Appointment Cancelled',
        message: `Appointment #${event.appointmentId} has been cancelled.`,
        timestamp,
        data: event
      };
    
    default:
      return {
        id: uuidv4(),
        type: 'info',
        icon: '📢',
        title: 'System Event',
        message: `Event received: ${event.eventType}`,
        timestamp,
        data: event
      };
  }
}

function addNotification(notification) {
  notifications.unshift(notification);
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.pop();
  }
}

function broadcastToClients(notification) {
  const message = JSON.stringify({ type: 'notification', data: notification });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// REST API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    kafka: kafkaConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/notifications', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(notifications.slice(0, limit));
});

app.get('/api/notifications/count', (req, res) => {
  res.json({ count: notifications.length });
});

app.post('/api/notifications', (req, res) => {
  const { type, title, message, icon } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  
  const notification = {
    id: uuidv4(),
    type: type || 'info',
    icon: icon || '📢',
    title,
    message,
    timestamp: new Date().toISOString()
  };
  
  addNotification(notification);
  broadcastToClients(notification);
  
  res.status(201).json(notification);
});

app.delete('/api/notifications', (req, res) => {
  notifications.length = 0;
  res.json({ success: true, message: 'All notifications cleared' });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'notification-service',
    version: '1.0.0',
    uptime: process.uptime(),
    kafka: {
      connected: kafkaConnected,
      brokers: KAFKA_BROKERS
    },
    websocket: {
      clients: wsClients.size
    },
    notifications: {
      count: notifications.length,
      maxStore: MAX_NOTIFICATIONS
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

const server = app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔔 DATAVET NOTIFICATION SERVICE STARTING... 🔔               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  // Connect to Kafka
  await connectKafka();
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🎮 NOTIFICATION SERVICE ONLINE - PORT ${PORT}                  ║
║   REST API:    http://localhost:${PORT}/api/notifications        ║
║   WebSocket:   ws://localhost:${PORT}                            ║
║   Kafka:       ${kafkaConnected ? 'CONNECTED' : 'DISCONNECTED'}                                      ║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  // Add startup notification
  addNotification({
    id: uuidv4(),
    type: 'success',
    icon: '🚀',
    title: 'Service Started',
    message: 'Notification service is now online and ready!',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔗 New WebSocket client connected');
  wsClients.add(ws);
  
  // Send recent notifications to new client
  ws.send(JSON.stringify({
    type: 'init',
    data: notifications.slice(0, 10)
  }));
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    wsClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down notification service...');
  await consumer.disconnect();
  server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down notification service...');
  await consumer.disconnect();
  server.close();
  process.exit(0);
});
