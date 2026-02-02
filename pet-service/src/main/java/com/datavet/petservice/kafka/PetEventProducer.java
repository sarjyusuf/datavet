package com.datavet.petservice.kafka;

import com.datavet.petservice.model.Pet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class PetEventProducer {

    private static final Logger logger = LoggerFactory.getLogger(PetEventProducer.class);
    private static final String TOPIC = "pet-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    public PetEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendPetCreatedEvent(Pet pet) {
        Map<String, Object> event = createEvent("PET_CREATED", pet);
        sendEvent(event, pet.getId().toString());
    }

    public void sendPetUpdatedEvent(Pet pet) {
        Map<String, Object> event = createEvent("PET_UPDATED", pet);
        sendEvent(event, pet.getId().toString());
    }

    public void sendPetDeletedEvent(Long petId) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "PET_DELETED");
        event.put("petId", petId);
        event.put("timestamp", System.currentTimeMillis());
        sendEvent(event, petId.toString());
    }

    private Map<String, Object> createEvent(String eventType, Pet pet) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("petId", pet.getId());
        event.put("petName", pet.getName());
        event.put("species", pet.getSpecies().toString());
        event.put("ownerName", pet.getOwnerName());
        event.put("timestamp", System.currentTimeMillis());
        return event;
    }

    private void sendEvent(Map<String, Object> event, String key) {
        try {
            CompletableFuture<SendResult<String, Object>> future = 
                kafkaTemplate.send(TOPIC, key, event);
            
            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    logger.info("Sent event {} with offset={}", 
                        event.get("eventType"), 
                        result.getRecordMetadata().offset());
                } else {
                    logger.warn("Unable to send event {}: {}", 
                        event.get("eventType"), 
                        ex.getMessage());
                }
            });
        } catch (Exception e) {
            logger.warn("Kafka not available, skipping event: {}", event.get("eventType"));
        }
    }
}
