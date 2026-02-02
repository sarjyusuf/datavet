"""
╔════════════════════════════════════════════════════════════════╗
║   🔍 DATAVET SEARCH SERVICE 🔍                                  ║
║   Solr-powered search microservice                             ║
╚════════════════════════════════════════════════════════════════╝
"""

import os
import json
import logging
import threading
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SOLR_URL = os.getenv("SOLR_URL", "http://localhost:8983/solr")
PET_SERVICE_URL = os.getenv("PET_SERVICE_URL", "http://localhost:8080")
APPOINTMENT_SERVICE_URL = os.getenv("APPOINTMENT_SERVICE_URL", "http://localhost:8081")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# Flask app
app = Flask(__name__)
CORS(app)

# Solr collections
PETS_COLLECTION = "datavet_pets"
APPOINTMENTS_COLLECTION = "datavet_appointments"

# In-memory search index (fallback when Solr is not available)
in_memory_index = {
    "pets": [],
    "appointments": []
}

solr_available = False


# ═══════════════════════════════════════════════════════════════
# SOLR INTEGRATION
# ═══════════════════════════════════════════════════════════════

def check_solr_connection():
    """Check if Solr is available."""
    global solr_available
    try:
        response = requests.get(f"{SOLR_URL}/admin/cores", timeout=5)
        solr_available = response.status_code == 200
        if solr_available:
            logger.info(f"✅ Solr connected at {SOLR_URL}")
        return solr_available
    except Exception as e:
        logger.warning(f"⚠️ Solr not available: {e}")
        solr_available = False
        return False


def create_solr_collection(collection_name):
    """Create a Solr collection if it doesn't exist."""
    try:
        # Check if collection exists
        response = requests.get(f"{SOLR_URL}/admin/collections?action=LIST")
        if response.status_code == 200:
            collections = response.json().get("collections", [])
            if collection_name not in collections:
                # Create collection
                requests.get(
                    f"{SOLR_URL}/admin/collections",
                    params={
                        "action": "CREATE",
                        "name": collection_name,
                        "numShards": 1,
                        "replicationFactor": 1
                    }
                )
                logger.info(f"Created Solr collection: {collection_name}")
    except Exception as e:
        logger.warning(f"Could not create Solr collection {collection_name}: {e}")


def index_to_solr(collection, documents):
    """Index documents to Solr."""
    if not solr_available:
        return False
    try:
        response = requests.post(
            f"{SOLR_URL}/{collection}/update/json/docs?commit=true",
            json=documents,
            headers={"Content-Type": "application/json"}
        )
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"Solr indexing failed: {e}")
        return False


def search_solr(collection, query, rows=50):
    """Search Solr collection."""
    if not solr_available:
        return None
    try:
        response = requests.get(
            f"{SOLR_URL}/{collection}/select",
            params={
                "q": query,
                "rows": rows,
                "wt": "json"
            }
        )
        if response.status_code == 200:
            return response.json().get("response", {}).get("docs", [])
    except Exception as e:
        logger.warning(f"Solr search failed: {e}")
    return None


# ═══════════════════════════════════════════════════════════════
# KAFKA CONSUMER (for index updates)
# ═══════════════════════════════════════════════════════════════

kafka_consumer = None


def start_kafka_consumer():
    """Start Kafka consumer for index updates."""
    global kafka_consumer
    try:
        from kafka import KafkaConsumer
        kafka_consumer = KafkaConsumer(
            'pet-events', 'appointment-events',
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id='search-service-group',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest'
        )
        logger.info("✅ Kafka consumer started for search service")
        
        # Process messages in background
        for message in kafka_consumer:
            process_event(message.topic, message.value)
    except Exception as e:
        logger.warning(f"⚠️ Kafka consumer not available: {e}")


def process_event(topic, event):
    """Process Kafka events for index updates."""
    try:
        if 'pet' in topic.lower():
            # Refresh pets index
            sync_pets_index()
        elif 'appointment' in topic.lower():
            # Refresh appointments index
            sync_appointments_index()
    except Exception as e:
        logger.error(f"Error processing event: {e}")


# ═══════════════════════════════════════════════════════════════
# INDEX SYNCHRONIZATION
# ═══════════════════════════════════════════════════════════════

def sync_pets_index():
    """Synchronize pets index from Pet Service."""
    try:
        response = requests.get(f"{PET_SERVICE_URL}/api/pets", timeout=10)
        if response.status_code == 200:
            pets = response.json()
            in_memory_index["pets"] = pets
            
            # Index to Solr if available
            if solr_available:
                solr_docs = [
                    {
                        "id": f"pet_{pet['id']}",
                        "type": "pet",
                        "entity_id": pet['id'],
                        "name": pet.get('name', ''),
                        "species": pet.get('species', ''),
                        "breed": pet.get('breed', ''),
                        "owner": pet.get('ownerName', ''),
                        "searchable_text": f"{pet.get('name', '')} {pet.get('species', '')} {pet.get('breed', '')} {pet.get('ownerName', '')}"
                    }
                    for pet in pets
                ]
                index_to_solr(PETS_COLLECTION, solr_docs)
            
            logger.info(f"Synced {len(pets)} pets to index")
            return True
    except Exception as e:
        logger.warning(f"Failed to sync pets: {e}")
    return False


def sync_appointments_index():
    """Synchronize appointments index from Appointment Service."""
    try:
        response = requests.get(f"{APPOINTMENT_SERVICE_URL}/api/appointments", timeout=10)
        if response.status_code == 200:
            appointments = response.json()
            in_memory_index["appointments"] = appointments
            
            # Index to Solr if available
            if solr_available:
                solr_docs = [
                    {
                        "id": f"appt_{appt['id']}",
                        "type": "appointment",
                        "entity_id": appt['id'],
                        "pet_id": appt.get('petId'),
                        "date": appt.get('date', ''),
                        "time": appt.get('time', ''),
                        "appointment_type": appt.get('appointmentType', ''),
                        "status": appt.get('status', ''),
                        "notes": appt.get('notes', ''),
                        "searchable_text": f"{appt.get('appointmentType', '')} {appt.get('date', '')} {appt.get('notes', '')}"
                    }
                    for appt in appointments
                ]
                index_to_solr(APPOINTMENTS_COLLECTION, solr_docs)
            
            logger.info(f"Synced {len(appointments)} appointments to index")
            return True
    except Exception as e:
        logger.warning(f"Failed to sync appointments: {e}")
    return False


def perform_in_memory_search(query, search_pets=True, search_appointments=True):
    """Perform search on in-memory index."""
    results = {"pets": [], "appointments": []}
    query_lower = query.lower()
    
    if search_pets:
        for pet in in_memory_index["pets"]:
            searchable = f"{pet.get('name', '')} {pet.get('species', '')} {pet.get('breed', '')} {pet.get('ownerName', '')}".lower()
            if query_lower in searchable:
                results["pets"].append(pet)
    
    if search_appointments:
        for appt in in_memory_index["appointments"]:
            searchable = f"{appt.get('appointmentType', '')} {appt.get('date', '')} {appt.get('notes', '')}".lower()
            if query_lower in searchable:
                results["appointments"].append(appt)
    
    return results


# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "UP",
        "service": "search-service",
        "solr": "connected" if solr_available else "disconnected",
        "indexed_pets": len(in_memory_index["pets"]),
        "indexed_appointments": len(in_memory_index["appointments"])
    })


@app.route('/api/search')
def search():
    """
    Main search endpoint.
    Query params:
        - q: search query string
        - pets: search pets (true/false)
        - appointments: search appointments (true/false)
    """
    query = request.args.get('q', '')
    search_pets = request.args.get('pets', 'true').lower() == 'true'
    search_appointments = request.args.get('appointments', 'true').lower() == 'true'
    
    if not query:
        return jsonify({"pets": [], "appointments": [], "message": "No search query provided"})
    
    # Try Solr first
    if solr_available:
        results = {"pets": [], "appointments": []}
        
        if search_pets:
            solr_results = search_solr(PETS_COLLECTION, f"searchable_text:*{query}*")
            if solr_results:
                # Map back to pet objects (Solr returns arrays, get first element)
                pet_ids = set()
                for r in solr_results:
                    eid = r.get('entity_id')
                    if isinstance(eid, list):
                        pet_ids.add(eid[0] if eid else None)
                    else:
                        pet_ids.add(eid)
                results["pets"] = [p for p in in_memory_index["pets"] if p.get('id') in pet_ids]
        
        if search_appointments:
            solr_results = search_solr(APPOINTMENTS_COLLECTION, f"searchable_text:*{query}*")
            if solr_results:
                appt_ids = set()
                for r in solr_results:
                    eid = r.get('entity_id')
                    if isinstance(eid, list):
                        appt_ids.add(eid[0] if eid else None)
                    else:
                        appt_ids.add(eid)
                results["appointments"] = [a for a in in_memory_index["appointments"] if a.get('id') in appt_ids]
        
        return jsonify(results)
    
    # Fallback to in-memory search
    results = perform_in_memory_search(query, search_pets, search_appointments)
    return jsonify(results)


@app.route('/api/search/pets')
def search_pets():
    """Search pets only."""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    results = perform_in_memory_search(query, search_pets=True, search_appointments=False)
    return jsonify(results["pets"])


@app.route('/api/search/appointments')
def search_appointments():
    """Search appointments only."""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    results = perform_in_memory_search(query, search_pets=False, search_appointments=True)
    return jsonify(results["appointments"])


@app.route('/api/search/reindex', methods=['POST'])
def reindex():
    """Trigger reindexing of all data."""
    pets_synced = sync_pets_index()
    appointments_synced = sync_appointments_index()
    
    return jsonify({
        "success": pets_synced or appointments_synced,
        "pets_indexed": len(in_memory_index["pets"]),
        "appointments_indexed": len(in_memory_index["appointments"]),
        "solr_available": solr_available
    })


@app.route('/api/search/stats')
def stats():
    """Get search index statistics."""
    return jsonify({
        "solr_url": SOLR_URL,
        "solr_available": solr_available,
        "in_memory_index": {
            "pets": len(in_memory_index["pets"]),
            "appointments": len(in_memory_index["appointments"])
        }
    })


# ═══════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════

def initialize():
    """Initialize the search service."""
    print("""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔍 DATAVET SEARCH SERVICE STARTING... 🔍                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    """)
    
    # Check Solr connection
    check_solr_connection()
    
    if solr_available:
        # Create collections if needed
        create_solr_collection(PETS_COLLECTION)
        create_solr_collection(APPOINTMENTS_COLLECTION)
    
    # Initial sync
    sync_pets_index()
    sync_appointments_index()
    
    # Start Kafka consumer in background thread
    kafka_thread = threading.Thread(target=start_kafka_consumer, daemon=True)
    kafka_thread.start()
    
    print(f"""
╔════════════════════════════════════════════════════════════════╗
║   🎮 SEARCH SERVICE ONLINE - PORT 8082                         ║
║   Solr:     {("CONNECTED" if solr_available else "DISCONNECTED"):12}                              ║
║   Pets:     {len(in_memory_index["pets"]):4} indexed                                   ║
║   Appts:    {len(in_memory_index["appointments"]):4} indexed                                   ║
╚════════════════════════════════════════════════════════════════╝
    """)


if __name__ == '__main__':
    initialize()
    app.run(host='0.0.0.0', port=8082, debug=False)
