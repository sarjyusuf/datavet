const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const PET_SERVICE_URL = process.env.PET_SERVICE_URL || 'http://localhost:8080';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:8081';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:8082';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'frontend', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════
// PET SERVICE PROXY
// ═══════════════════════════════════════════════════════════════

app.get('/api/pets', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/pets`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pets:', error.message);
    res.status(500).json({ error: 'Failed to fetch pets', details: error.message });
  }
});

app.get('/api/pets/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/pets/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pet:', error.message);
    res.status(500).json({ error: 'Failed to fetch pet', details: error.message });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const response = await axios.post(`${PET_SERVICE_URL}/api/pets`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating pet:', error.message);
    res.status(500).json({ error: 'Failed to create pet', details: error.message });
  }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const response = await axios.put(`${PET_SERVICE_URL}/api/pets/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating pet:', error.message);
    res.status(500).json({ error: 'Failed to update pet', details: error.message });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${PET_SERVICE_URL}/api/pets/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting pet:', error.message);
    res.status(500).json({ error: 'Failed to delete pet', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// VET SERVICE PROXY
// ═══════════════════════════════════════════════════════════════

app.get('/api/vets', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/vets`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching vets:', error.message);
    res.status(500).json({ error: 'Failed to fetch vets', details: error.message });
  }
});

app.get('/api/vets/available', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/vets/available`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching available vets:', error.message);
    res.status(500).json({ error: 'Failed to fetch available vets', details: error.message });
  }
});

app.get('/api/vets/specializations', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/vets/specializations`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching specializations:', error.message);
    res.status(500).json({ error: 'Failed to fetch specializations', details: error.message });
  }
});

app.get('/api/vets/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PET_SERVICE_URL}/api/vets/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching vet:', error.message);
    res.status(500).json({ error: 'Failed to fetch vet', details: error.message });
  }
});

app.post('/api/vets', async (req, res) => {
  try {
    const response = await axios.post(`${PET_SERVICE_URL}/api/vets`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating vet:', error.message);
    res.status(500).json({ error: 'Failed to create vet', details: error.message });
  }
});

app.put('/api/vets/:id', async (req, res) => {
  try {
    const response = await axios.put(`${PET_SERVICE_URL}/api/vets/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating vet:', error.message);
    res.status(500).json({ error: 'Failed to update vet', details: error.message });
  }
});

app.delete('/api/vets/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${PET_SERVICE_URL}/api/vets/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting vet:', error.message);
    res.status(500).json({ error: 'Failed to delete vet', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// APPOINTMENT SERVICE PROXY
// ═══════════════════════════════════════════════════════════════

app.get('/api/appointments', async (req, res) => {
  try {
    const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointments:', error.message);
    res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
  }
});

app.get('/api/appointments/vet/:vetId', async (req, res) => {
  try {
    const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/vet/${req.params.vetId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching vet appointments:', error.message);
    res.status(500).json({ error: 'Failed to fetch vet appointments', details: error.message });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointment:', error.message);
    res.status(500).json({ error: 'Failed to fetch appointment', details: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const response = await axios.post(`${APPOINTMENT_SERVICE_URL}/api/appointments`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const response = await axios.put(`${APPOINTMENT_SERVICE_URL}/api/appointments/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating appointment:', error.message);
    res.status(500).json({ error: 'Failed to update appointment', details: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${APPOINTMENT_SERVICE_URL}/api/appointments/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting appointment:', error.message);
    res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CALENDAR SERVICE PROXY
// ═══════════════════════════════════════════════════════════════

app.get('/api/calendar/vet/:vetId', async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.start_date) params.append('start_date', req.query.start_date);
    if (req.query.days) params.append('days', req.query.days);
    
    const url = `${APPOINTMENT_SERVICE_URL}/api/calendar/vet/${req.params.vetId}?${params.toString()}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching vet calendar:', error.message);
    res.status(500).json({ error: 'Failed to fetch vet calendar', details: error.message });
  }
});

app.get('/api/calendar/available-slots', async (req, res) => {
  try {
    const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/calendar/available-slots`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching available slots:', error.message);
    res.status(500).json({ error: 'Failed to fetch available slots', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SEARCH SERVICE PROXY
// ═══════════════════════════════════════════════════════════════

app.get('/api/search', async (req, res) => {
  try {
    const response = await axios.get(`${SEARCH_SERVICE_URL}/api/search`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    console.error('Error searching:', error.message);
    res.status(500).json({ error: 'Failed to search', details: error.message });
  }
});

app.post('/api/search/reindex', async (req, res) => {
  try {
    const response = await axios.post(`${SEARCH_SERVICE_URL}/api/search/reindex`);
    res.json(response.data);
  } catch (error) {
    console.error('Error reindexing:', error.message);
    res.status(500).json({ error: 'Failed to reindex', details: error.message });
  }
});

// Serve main page for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎮 DATAVET FRONTEND SERVER STARTED! 🎮                       ║
║                                                                ║
║   Port: ${PORT}                                                   ║
║   URL:  http://localhost:${PORT}                                  ║
║                                                                ║
║   INSERT COIN TO CONTINUE...                                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
