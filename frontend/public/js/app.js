/**
 * ═══════════════════════════════════════════════════════════════
 *  DATAVET - RETRO ARCADE FRONTEND APPLICATION
 *  Version 2.0 - With Vets and Calendar System
 * ═══════════════════════════════════════════════════════════════
 */

// API Configuration
const API_BASE = '';  // Uses relative URLs through the proxy

// State
let pets = [];
let vets = [];
let appointments = [];
let notifications = [];
let currentCalendarDate = new Date();
let selectedVetId = null;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 DataVet Arcade v2.0 initialized!');
  
  // Set default date for appointment form
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('appt-date');
  if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
  }
  
  // Initialize all data
  loadDashboardStats();
  loadPets();
  loadVets();
  loadAppointments();
  
  // Setup form handlers
  setupFormHandlers();
  
  // Setup keyboard navigation
  setupKeyboardNav();
});

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function showSection(sectionId) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.section === sectionId) {
      btn.classList.add('active');
    }
  });
  
  // Update sections
  document.querySelectorAll('.game-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');
  
  // Refresh data for specific sections
  if (sectionId === 'pets') loadPets();
  if (sectionId === 'vets') loadVets();
  if (sectionId === 'appointments') {
    loadAppointments();
    populatePetSelect();
    populateVetSelect();
  }
  if (sectionId === 'calendar') {
    populateCalendarVetSelect();
  }
}

function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    const sections = ['home', 'pets', 'vets', 'calendar', 'appointments', 'search'];
    const currentIndex = sections.findIndex(s => 
      document.getElementById(s).classList.contains('active')
    );
    
    if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
      showSection(sections[currentIndex + 1]);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      showSection(sections[currentIndex - 1]);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

async function loadDashboardStats() {
  try {
    // Fetch pets count
    const petsResponse = await fetch('/api/pets');
    if (petsResponse.ok) {
      const petsData = await petsResponse.json();
      pets = petsData;
      document.getElementById('total-pets').textContent = petsData.length;
      updateSpeciesLeaderboard(petsData);
    }
  } catch (error) {
    console.log('Pets service not available');
  }
  
  try {
    // Fetch vets count
    const vetsResponse = await fetch('/api/vets');
    if (vetsResponse.ok) {
      const vetsData = await vetsResponse.json();
      vets = vetsData;
      const availableVets = vetsData.filter(v => v.available !== false).length;
      document.getElementById('total-vets').textContent = availableVets;
    }
  } catch (error) {
    console.log('Vets service not available');
  }
  
  try {
    // Fetch appointments count
    const appointmentsResponse = await fetch('/api/appointments');
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = appointmentsData;
      document.getElementById('total-appointments').textContent = appointmentsData.length;
      
      // Count today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayCount = appointmentsData.filter(a => a.date === today).length;
      document.getElementById('today-appointments').textContent = todayCount;
    }
  } catch (error) {
    console.log('Appointments service not available');
  }
}

function updateSpeciesLeaderboard(petsData) {
  const speciesCount = {};
  petsData.forEach(pet => {
    const species = pet.species || 'UNKNOWN';
    speciesCount[species] = (speciesCount[species] || 0) + 1;
  });
  
  const sorted = Object.entries(speciesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const leaderboard = document.getElementById('species-leaderboard');
  const ranks = ['1ST', '2ND', '3RD'];
  
  leaderboard.innerHTML = sorted.map((entry, index) => `
    <div class="score-row">
      <span class="rank">${ranks[index]}</span>
      <span class="name">${entry[0]}</span>
      <span class="score">${entry[1]}</span>
    </div>
  `).join('') || `
    <div class="score-row">
      <span class="rank">---</span>
      <span class="name">NO DATA</span>
      <span class="score">---</span>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// PETS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function loadPets() {
  const container = document.getElementById('pets-list');
  container.innerHTML = `
    <div class="loading-spinner">
      <span class="spinner-dot">●</span>
      <span class="spinner-text">LOADING PETS...</span>
    </div>
  `;
  
  try {
    const response = await fetch('/api/pets');
    if (!response.ok) throw new Error('Failed to fetch pets');
    
    const data = await response.json();
    pets = data;
    
    if (data.length === 0) {
      container.innerHTML = '<p class="no-data">NO PETS REGISTERED YET. ADD YOUR FIRST PET!</p>';
      return;
    }
    
    container.innerHTML = data.map(pet => createPetCard(pet)).join('');
  } catch (error) {
    console.error('Error loading pets:', error);
    container.innerHTML = `
      <p class="no-data">⚠️ UNABLE TO CONNECT TO PET SERVICE</p>
    `;
  }
}

function createPetCard(pet) {
  const speciesEmoji = {
    'DOG': '🐕',
    'CAT': '🐈',
    'BIRD': '🐦',
    'RABBIT': '🐰',
    'HAMSTER': '🐹',
    'FISH': '🐠',
    'REPTILE': '🦎',
    'OTHER': '🐾'
  };
  
  return `
    <div class="item-card" data-id="${pet.id}">
      <div class="card-header">
        <span class="card-id">#${pet.id}</span>
        <span class="card-icon">${speciesEmoji[pet.species] || '🐾'}</span>
      </div>
      <h4 class="card-title">${pet.name}</h4>
      <p class="card-info"><strong>Species:</strong> ${pet.species || 'Unknown'}</p>
      <p class="card-info"><strong>Breed:</strong> ${pet.breed || 'Unknown'}</p>
      <p class="card-info"><strong>Age:</strong> ${pet.age || 'Unknown'} years</p>
      <p class="card-info"><strong>Owner:</strong> ${pet.ownerName || 'Unknown'}</p>
      <div class="card-actions">
        <button class="card-btn edit" onclick="editPet(${pet.id})">EDIT</button>
        <button class="card-btn delete" onclick="deletePet(${pet.id})">DELETE</button>
      </div>
    </div>
  `;
}

function setupFormHandlers() {
  // Pet form
  const petForm = document.getElementById('pet-form');
  if (petForm) {
    petForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createPet();
    });
  }
  
  // Appointment form
  const appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createAppointment();
    });
  }
  
  // Search input enter key
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
}

async function createPet() {
  const petData = {
    name: document.getElementById('pet-name').value,
    species: document.getElementById('pet-species').value,
    breed: document.getElementById('pet-breed').value,
    age: parseInt(document.getElementById('pet-age').value) || null,
    ownerName: document.getElementById('pet-owner').value
  };
  
  try {
    const response = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petData)
    });
    
    if (!response.ok) throw new Error('Failed to create pet');
    
    showToast('PET REGISTERED SUCCESSFULLY!', 'success');
    document.getElementById('pet-form').reset();
    loadPets();
    loadDashboardStats();
    triggerSearchReindex(); // Sync search index
  } catch (error) {
    console.error('Error creating pet:', error);
    showToast('FAILED TO CREATE PET', 'error');
  }
}

async function editPet(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  
  const newName = prompt('Enter new name:', pet.name);
  if (newName === null) return;
  
  try {
    const response = await fetch(`/api/pets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pet, name: newName })
    });
    
    if (!response.ok) throw new Error('Failed to update pet');
    
    showToast('PET UPDATED!', 'success');
    loadPets();
  } catch (error) {
    console.error('Error updating pet:', error);
    showToast('FAILED TO UPDATE PET', 'error');
  }
}

async function deletePet(id) {
  if (!confirm('Are you sure you want to delete this pet?')) return;
  
  try {
    const response = await fetch(`/api/pets/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete pet');
    
    showToast('PET REMOVED!', 'success');
    loadPets();
    loadDashboardStats();
    triggerSearchReindex(); // Sync search index
  } catch (error) {
    console.error('Error deleting pet:', error);
    showToast('FAILED TO DELETE PET', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// VETS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function loadVets() {
  const container = document.getElementById('vets-list');
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-spinner">
      <span class="spinner-dot">●</span>
      <span class="spinner-text">LOADING VETS...</span>
    </div>
  `;
  
  try {
    const response = await fetch('/api/vets');
    if (!response.ok) throw new Error('Failed to fetch vets');
    
    const data = await response.json();
    vets = data;
    
    if (data.length === 0) {
      container.innerHTML = '<p class="no-data">NO VETS REGISTERED YET.</p>';
      return;
    }
    
    container.innerHTML = data.map(vet => createVetCard(vet)).join('');
  } catch (error) {
    console.error('Error loading vets:', error);
    container.innerHTML = `
      <p class="no-data">⚠️ UNABLE TO CONNECT TO VET SERVICE</p>
    `;
  }
}

function createVetCard(vet) {
  const specEmoji = {
    'GENERAL_PRACTICE': '🏥',
    'SURGERY': '🔪',
    'DENTISTRY': '🦷',
    'DERMATOLOGY': '🧴',
    'CARDIOLOGY': '❤️',
    'ORTHOPEDICS': '🦴',
    'ONCOLOGY': '🔬',
    'EMERGENCY': '🚨',
    'EXOTIC_ANIMALS': '🦜',
    'BEHAVIOR': '🧠'
  };
  
  const statusClass = vet.available !== false ? 'available' : 'unavailable';
  const statusText = vet.available !== false ? '● AVAILABLE' : '○ UNAVAILABLE';
  
  return `
    <div class="vet-card ${statusClass}">
      <div class="vet-avatar">
        ${specEmoji[vet.specialization] || '👨‍⚕️'}
      </div>
      <div class="vet-info">
        <h4 class="vet-name">${vet.name}</h4>
        <p class="vet-spec">${formatSpecialization(vet.specialization)}</p>
        <p class="vet-status ${statusClass}">${statusText}</p>
        <p class="vet-hours">🕐 ${vet.workingHoursStart || '09:00'} - ${vet.workingHoursEnd || '17:00'}</p>
        ${vet.bio ? `<p class="vet-bio">${vet.bio}</p>` : ''}
      </div>
      <div class="vet-actions">
        <button class="card-btn view" onclick="viewVetCalendar(${vet.id})">VIEW CALENDAR</button>
        <button class="card-btn book" onclick="bookWithVet(${vet.id})">BOOK NOW</button>
      </div>
    </div>
  `;
}

function formatSpecialization(spec) {
  if (!spec) return 'General Practice';
  return spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function viewVetCalendar(vetId) {
  showSection('calendar');
  setTimeout(() => {
    const select = document.getElementById('calendar-vet-select');
    if (select) {
      select.value = vetId;
      loadVetCalendar();
    }
  }, 100);
}

function bookWithVet(vetId) {
  showSection('appointments');
  setTimeout(() => {
    const select = document.getElementById('appt-vet-select');
    if (select) {
      select.value = vetId;
      loadAvailableSlots();
    }
  }, 100);
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR SYSTEM
// ═══════════════════════════════════════════════════════════════

function populateCalendarVetSelect() {
  const select = document.getElementById('calendar-vet-select');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- SELECT A VET --</option>' + 
    vets.map(vet => `<option value="${vet.id}">${vet.name} (${formatSpecialization(vet.specialization)})</option>`).join('');
}

async function loadVetCalendar() {
  const vetId = document.getElementById('calendar-vet-select').value;
  const container = document.getElementById('calendar-view');
  
  if (!vetId) {
    container.innerHTML = '<p class="no-data">SELECT A VET TO VIEW THEIR CALENDAR</p>';
    document.getElementById('calendar-date-range').textContent = 'SELECT A VET';
    return;
  }
  
  selectedVetId = vetId;
  
  container.innerHTML = `
    <div class="loading-spinner">
      <span class="spinner-dot">●</span>
      <span class="spinner-text">LOADING CALENDAR...</span>
    </div>
  `;
  
  const startDate = currentCalendarDate.toISOString().split('T')[0];
  
  try {
    const response = await fetch(`/api/calendar/vet/${vetId}?start_date=${startDate}&days=7`);
    if (!response.ok) throw new Error('Failed to fetch calendar');
    
    const data = await response.json();
    
    // Update date range display
    document.getElementById('calendar-date-range').textContent = 
      `${formatDateShort(data.startDate)} - ${formatDateShort(data.endDate)}`;
    
    // Render calendar
    container.innerHTML = renderCalendar(data.days);
  } catch (error) {
    console.error('Error loading calendar:', error);
    container.innerHTML = '<p class="no-data">⚠️ FAILED TO LOAD CALENDAR</p>';
  }
}

function renderCalendar(days) {
  if (!days || days.length === 0) {
    return '<p class="no-data">NO CALENDAR DATA AVAILABLE</p>';
  }
  
  return `
    <div class="calendar-week">
      ${days.map(day => renderCalendarDay(day)).join('')}
    </div>
  `;
}

function renderCalendarDay(day) {
  const isToday = day.date === new Date().toISOString().split('T')[0];
  const dayClass = day.slots.length === 0 ? 'off-day' : '';
  
  return `
    <div class="calendar-day ${dayClass} ${isToday ? 'today' : ''}">
      <div class="day-header">
        <span class="day-name">${day.dayOfWeek}</span>
        <span class="day-date">${formatDateShort(day.date)}</span>
        ${day.slots.length > 0 ? `<span class="day-stats">${day.availableSlots}/${day.totalSlots} FREE</span>` : '<span class="day-stats off">OFF</span>'}
      </div>
      <div class="day-slots">
        ${day.slots.length === 0 ? 
          '<div class="slot off-slot">OFF DUTY</div>' :
          day.slots.map(slot => renderTimeSlot(slot, day.date)).join('')
        }
      </div>
    </div>
  `;
}

function renderTimeSlot(slot, date) {
  if (slot.available) {
    return `
      <div class="slot available-slot" onclick="quickBook('${date}', '${slot.time}', '${slot.endTime}')">
        <span class="slot-time">${slot.time}</span>
        <span class="slot-status">FREE</span>
      </div>
    `;
  } else {
    return `
      <div class="slot booked-slot">
        <span class="slot-time">${slot.time}</span>
        <span class="slot-pet">${slot.petName || 'Booked'}</span>
        <span class="slot-type">${slot.appointmentType || ''}</span>
      </div>
    `;
  }
}

function navigateCalendar(days) {
  currentCalendarDate.setDate(currentCalendarDate.getDate() + days);
  loadVetCalendar();
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function quickBook(date, time, endTime) {
  showSection('appointments');
  setTimeout(() => {
    const vetSelect = document.getElementById('appt-vet-select');
    const dateInput = document.getElementById('appt-date');
    
    if (vetSelect && selectedVetId) {
      vetSelect.value = selectedVetId;
    }
    if (dateInput) {
      dateInput.value = date;
    }
    
    loadAvailableSlots().then(() => {
      const timeSelect = document.getElementById('appt-time-slot');
      if (timeSelect) {
        timeSelect.value = time;
      }
    });
  }, 100);
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function populatePetSelect() {
  const select = document.getElementById('appt-pet-select');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- SELECT PET --</option>' + 
    pets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species}) - ${pet.ownerName}</option>`).join('');
}

function populateVetSelect() {
  const select = document.getElementById('appt-vet-select');
  if (!select) return;
  
  const availableVets = vets.filter(v => v.available !== false);
  select.innerHTML = '<option value="">-- SELECT VET --</option>' + 
    availableVets.map(vet => `<option value="${vet.id}">${vet.name} (${formatSpecialization(vet.specialization)})</option>`).join('');
}

async function loadAvailableSlots() {
  const vetId = document.getElementById('appt-vet-select').value;
  const date = document.getElementById('appt-date').value;
  const select = document.getElementById('appt-time-slot');
  
  if (!vetId || !date) {
    select.innerHTML = '<option value="">-- SELECT DATE & VET FIRST --</option>';
    return;
  }
  
  select.innerHTML = '<option value="">LOADING SLOTS...</option>';
  
  try {
    const response = await fetch(`/api/calendar/available-slots?vet_id=${vetId}&date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch slots');
    
    const data = await response.json();
    
    if (data.availableSlots.length === 0) {
      select.innerHTML = '<option value="">NO AVAILABLE SLOTS</option>';
      return;
    }
    
    select.innerHTML = '<option value="">-- SELECT TIME --</option>' +
      data.availableSlots.map(slot => 
        `<option value="${slot.time}" data-end="${slot.endTime}">${slot.time} - ${slot.endTime}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading slots:', error);
    select.innerHTML = '<option value="">ERROR LOADING SLOTS</option>';
  }
}

async function loadAppointments() {
  const container = document.getElementById('appointments-list');
  container.innerHTML = `
    <div class="loading-spinner">
      <span class="spinner-dot">●</span>
      <span class="spinner-text">LOADING APPOINTMENTS...</span>
    </div>
  `;
  
  try {
    const response = await fetch('/api/appointments');
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const data = await response.json();
    appointments = data;
    
    if (data.length === 0) {
      container.innerHTML = '<p class="no-data">NO APPOINTMENTS SCHEDULED. BOOK ONE NOW!</p>';
      return;
    }
    
    // Sort by date and time
    data.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
    
    container.innerHTML = data.map(appt => createAppointmentCard(appt)).join('');
  } catch (error) {
    console.error('Error loading appointments:', error);
    container.innerHTML = `
      <p class="no-data">⚠️ UNABLE TO CONNECT TO APPOINTMENT SERVICE</p>
    `;
  }
}

function createAppointmentCard(appointment) {
  const typeEmoji = {
    'CHECKUP': '💊',
    'VACCINATION': '💉',
    'SURGERY': '🏥',
    'GROOMING': '✂️',
    'EMERGENCY': '🚨',
    'DENTAL': '🦷'
  };
  
  const statusClass = {
    'SCHEDULED': 'scheduled',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  
  const vet = vets.find(v => v.id === appointment.vetId);
  const vetName = vet ? vet.name : `Vet #${appointment.vetId}`;
  
  return `
    <div class="item-card appointment-card ${statusClass[appointment.status] || ''}">
      <div class="card-header">
        <span class="card-id">#${appointment.id}</span>
        <span class="card-icon">${typeEmoji[appointment.appointmentType] || '📋'}</span>
      </div>
      <h4 class="card-title">${appointment.appointmentType || 'APPOINTMENT'}</h4>
      <p class="card-info"><strong>Pet:</strong> ${appointment.petName || `Pet #${appointment.petId}`}</p>
      <p class="card-info"><strong>Owner:</strong> ${appointment.ownerName || 'Unknown'}</p>
      <p class="card-info"><strong>Vet:</strong> ${vetName}</p>
      <p class="card-info"><strong>Date:</strong> ${appointment.date}</p>
      <p class="card-info"><strong>Time:</strong> ${appointment.time}${appointment.endTime ? ` - ${appointment.endTime}` : ''}</p>
      <p class="card-info"><strong>Status:</strong> 
        <span class="status-badge ${statusClass[appointment.status] || ''}">${appointment.status || 'SCHEDULED'}</span>
      </p>
      ${appointment.notes ? `<p class="card-info"><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
      <div class="card-actions">
        <button class="card-btn edit" onclick="editAppointment(${appointment.id})">EDIT</button>
        <button class="card-btn delete" onclick="deleteAppointment(${appointment.id})">CANCEL</button>
      </div>
    </div>
  `;
}

async function createAppointment() {
  const petSelect = document.getElementById('appt-pet-select');
  const selectedPet = pets.find(p => p.id === parseInt(petSelect.value));
  
  const timeSelect = document.getElementById('appt-time-slot');
  const selectedOption = timeSelect.options[timeSelect.selectedIndex];
  const endTime = selectedOption?.dataset?.end || null;
  
  const appointmentData = {
    petId: parseInt(document.getElementById('appt-pet-select').value),
    vetId: parseInt(document.getElementById('appt-vet-select').value),
    date: document.getElementById('appt-date').value,
    time: document.getElementById('appt-time-slot').value,
    endTime: endTime,
    appointmentType: document.getElementById('appt-type').value,
    notes: document.getElementById('appt-notes').value,
    petName: selectedPet?.name || null,
    ownerName: selectedPet?.ownerName || null,
    status: 'SCHEDULED'
  };
  
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (error.detail === 'Time slot already booked') {
        showToast('TIME SLOT ALREADY BOOKED!', 'error');
        return;
      }
      throw new Error('Failed to create appointment');
    }
    
    showToast('APPOINTMENT BOOKED!', 'success');
    document.getElementById('appointment-form').reset();
    document.getElementById('appt-date').value = new Date().toISOString().split('T')[0];
    loadAppointments();
    loadDashboardStats();
    triggerSearchReindex(); // Sync search index
  } catch (error) {
    console.error('Error creating appointment:', error);
    showToast('FAILED TO BOOK APPOINTMENT', 'error');
  }
}

async function editAppointment(id) {
  const appointment = appointments.find(a => a.id === id);
  if (!appointment) return;
  
  const newDate = prompt('Enter new date (YYYY-MM-DD):', appointment.date);
  if (newDate === null) return;
  
  try {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...appointment, date: newDate })
    });
    
    if (!response.ok) throw new Error('Failed to update appointment');
    
    showToast('APPOINTMENT UPDATED!', 'success');
    loadAppointments();
  } catch (error) {
    console.error('Error updating appointment:', error);
    showToast('FAILED TO UPDATE APPOINTMENT', 'error');
  }
}

async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;
  
  try {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete appointment');
    
    showToast('APPOINTMENT CANCELLED!', 'success');
    loadAppointments();
    loadDashboardStats();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    showToast('FAILED TO CANCEL APPOINTMENT', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════

async function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  const searchPets = document.getElementById('search-pets').checked;
  const searchAppointments = document.getElementById('search-appointments').checked;
  
  if (!query) {
    showToast('ENTER A SEARCH QUERY', 'info');
    return;
  }
  
  const container = document.getElementById('search-results');
  container.innerHTML = `
    <div class="loading-spinner">
      <span class="spinner-dot">●</span>
      <span class="spinner-text">SEARCHING...</span>
    </div>
  `;
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&pets=${searchPets}&appointments=${searchAppointments}`);
    
    if (!response.ok) throw new Error('Search failed');
    
    const results = await response.json();
    
    if (!results.pets?.length && !results.appointments?.length) {
      container.innerHTML = '<p class="no-results">NO RESULTS FOUND</p>';
      return;
    }
    
    let html = '';
    
    if (results.pets?.length) {
      html += results.pets.map(pet => createPetCard(pet)).join('');
    }
    
    if (results.appointments?.length) {
      html += results.appointments.map(appt => createAppointmentCard(appt)).join('');
    }
    
    container.innerHTML = html;
    showToast(`FOUND ${(results.pets?.length || 0) + (results.appointments?.length || 0)} RESULTS`, 'success');
  } catch (error) {
    console.error('Search error:', error);
    performLocalSearch(query, searchPets, searchAppointments);
  }
}

function performLocalSearch(query, searchPets, searchAppointments) {
  const container = document.getElementById('search-results');
  const queryLower = query.toLowerCase();
  let results = [];
  
  if (searchPets) {
    const matchedPets = pets.filter(pet => 
      pet.name?.toLowerCase().includes(queryLower) ||
      pet.species?.toLowerCase().includes(queryLower) ||
      pet.breed?.toLowerCase().includes(queryLower) ||
      pet.ownerName?.toLowerCase().includes(queryLower)
    );
    results.push(...matchedPets.map(p => createPetCard(p)));
  }
  
  if (searchAppointments) {
    const matchedAppointments = appointments.filter(appt =>
      appt.appointmentType?.toLowerCase().includes(queryLower) ||
      appt.notes?.toLowerCase().includes(queryLower) ||
      appt.petName?.toLowerCase().includes(queryLower) ||
      appt.date?.includes(query)
    );
    results.push(...matchedAppointments.map(a => createAppointmentCard(a)));
  }
  
  if (results.length === 0) {
    container.innerHTML = '<p class="no-results">NO RESULTS FOUND (LOCAL SEARCH)</p>';
  } else {
    container.innerHTML = results.join('');
    showToast(`FOUND ${results.length} RESULTS (LOCAL)`, 'info');
  }
}

// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// SEARCH INDEX SYNC
// ═══════════════════════════════════════════════════════════════

async function triggerSearchReindex() {
  try {
    await fetch('/api/search/reindex', { method: 'POST' });
    console.log('Search index refreshed');
  } catch (error) {
    console.log('Search reindex skipped (service may be unavailable)');
  }
}

// Debug
window.debugDataVet = () => {
  console.log('Pets:', pets);
  console.log('Vets:', vets);
  console.log('Appointments:', appointments);
};

console.log('🎮 DataVet v2.0 JS loaded! Type debugDataVet() to see app state.');
