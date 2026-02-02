package com.datavet.petservice.service;

import com.datavet.petservice.model.Pet;
import com.datavet.petservice.repository.PetRepository;
import com.datavet.petservice.kafka.PetEventProducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PetService {

    private final PetRepository petRepository;
    private final PetEventProducer eventProducer;

    @Autowired
    public PetService(PetRepository petRepository, PetEventProducer eventProducer) {
        this.petRepository = petRepository;
        this.eventProducer = eventProducer;
    }

    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    public Optional<Pet> getPetById(Long id) {
        return petRepository.findById(id);
    }

    public Pet createPet(Pet pet) {
        Pet savedPet = petRepository.save(pet);
        eventProducer.sendPetCreatedEvent(savedPet);
        return savedPet;
    }

    public Optional<Pet> updatePet(Long id, Pet petDetails) {
        return petRepository.findById(id).map(existingPet -> {
            existingPet.setName(petDetails.getName());
            existingPet.setSpecies(petDetails.getSpecies());
            existingPet.setBreed(petDetails.getBreed());
            existingPet.setAge(petDetails.getAge());
            existingPet.setOwnerName(petDetails.getOwnerName());
            existingPet.setOwnerEmail(petDetails.getOwnerEmail());
            existingPet.setOwnerPhone(petDetails.getOwnerPhone());
            existingPet.setMedicalNotes(petDetails.getMedicalNotes());
            
            Pet updatedPet = petRepository.save(existingPet);
            eventProducer.sendPetUpdatedEvent(updatedPet);
            return updatedPet;
        });
    }

    public boolean deletePet(Long id) {
        return petRepository.findById(id).map(pet -> {
            petRepository.delete(pet);
            eventProducer.sendPetDeletedEvent(id);
            return true;
        }).orElse(false);
    }

    public List<Pet> getPetsBySpecies(Pet.Species species) {
        return petRepository.findBySpecies(species);
    }

    public List<Pet> searchPets(String query) {
        return petRepository.searchPets(query);
    }

    public List<Pet> getPetsByOwner(String ownerName) {
        return petRepository.findByOwnerNameContainingIgnoreCase(ownerName);
    }

    public List<Object[]> getSpeciesStatistics() {
        return petRepository.getSpeciesStatistics();
    }
}
