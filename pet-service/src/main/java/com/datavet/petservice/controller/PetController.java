package com.datavet.petservice.controller;

import com.datavet.petservice.model.Pet;
import com.datavet.petservice.service.PetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
@CrossOrigin(origins = "*")
public class PetController {

    private final PetService petService;

    @Autowired
    public PetController(PetService petService) {
        this.petService = petService;
    }

    @GetMapping
    public ResponseEntity<List<Pet>> getAllPets() {
        List<Pet> pets = petService.getAllPets();
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pet> getPetById(@PathVariable Long id) {
        return petService.getPetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Pet> createPet(@Valid @RequestBody Pet pet) {
        Pet createdPet = petService.createPet(pet);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPet);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pet> updatePet(@PathVariable Long id, @Valid @RequestBody Pet pet) {
        return petService.updatePet(id, pet)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePet(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        if (petService.deletePet(id)) {
            response.put("success", true);
            response.put("message", "Pet deleted successfully");
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Pet not found");
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/species/{species}")
    public ResponseEntity<List<Pet>> getPetsBySpecies(@PathVariable Pet.Species species) {
        List<Pet> pets = petService.getPetsBySpecies(species);
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Pet>> searchPets(@RequestParam String q) {
        List<Pet> pets = petService.searchPets(q);
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/owner/{ownerName}")
    public ResponseEntity<List<Pet>> getPetsByOwner(@PathVariable String ownerName) {
        List<Pet> pets = petService.getPetsByOwner(ownerName);
        return ResponseEntity.ok(pets);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPets", petService.getAllPets().size());
        stats.put("speciesBreakdown", petService.getSpeciesStatistics());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "pet-service");
        return ResponseEntity.ok(health);
    }
}
