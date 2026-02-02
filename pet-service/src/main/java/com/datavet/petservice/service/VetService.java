package com.datavet.petservice.service;

import com.datavet.petservice.model.Vet;
import com.datavet.petservice.repository.VetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class VetService {

    private final VetRepository vetRepository;

    @Autowired
    public VetService(VetRepository vetRepository) {
        this.vetRepository = vetRepository;
    }

    public List<Vet> getAllVets() {
        return vetRepository.findAll();
    }

    public Optional<Vet> getVetById(Long id) {
        return vetRepository.findById(id);
    }

    public Vet createVet(Vet vet) {
        return vetRepository.save(vet);
    }

    public Optional<Vet> updateVet(Long id, Vet vetDetails) {
        return vetRepository.findById(id).map(existingVet -> {
            existingVet.setName(vetDetails.getName());
            existingVet.setSpecialization(vetDetails.getSpecialization());
            existingVet.setEmail(vetDetails.getEmail());
            existingVet.setPhone(vetDetails.getPhone());
            existingVet.setBio(vetDetails.getBio());
            existingVet.setImageUrl(vetDetails.getImageUrl());
            existingVet.setAvailable(vetDetails.getAvailable());
            existingVet.setWorkingHoursStart(vetDetails.getWorkingHoursStart());
            existingVet.setWorkingHoursEnd(vetDetails.getWorkingHoursEnd());
            existingVet.setWorkingDays(vetDetails.getWorkingDays());
            existingVet.setSlotDurationMinutes(vetDetails.getSlotDurationMinutes());
            return vetRepository.save(existingVet);
        });
    }

    public boolean deleteVet(Long id) {
        return vetRepository.findById(id).map(vet -> {
            vetRepository.delete(vet);
            return true;
        }).orElse(false);
    }

    public List<Vet> getAvailableVets() {
        return vetRepository.findByAvailable(true);
    }

    public List<Vet> getVetsBySpecialization(String specialization) {
        return vetRepository.findBySpecialization(specialization);
    }

    public List<Vet> searchVets(String query) {
        return vetRepository.searchVets(query);
    }

    public List<String> getAllSpecializations() {
        return vetRepository.getAllSpecializations();
    }
}
