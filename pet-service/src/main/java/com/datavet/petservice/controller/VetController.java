package com.datavet.petservice.controller;

import com.datavet.petservice.model.Vet;
import com.datavet.petservice.service.VetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vets")
@CrossOrigin(origins = "*")
public class VetController {

    private final VetService vetService;

    @Autowired
    public VetController(VetService vetService) {
        this.vetService = vetService;
    }

    @GetMapping
    public ResponseEntity<List<Vet>> getAllVets() {
        List<Vet> vets = vetService.getAllVets();
        return ResponseEntity.ok(vets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vet> getVetById(@PathVariable Long id) {
        return vetService.getVetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Vet> createVet(@Valid @RequestBody Vet vet) {
        Vet createdVet = vetService.createVet(vet);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVet);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vet> updateVet(@PathVariable Long id, @Valid @RequestBody Vet vet) {
        return vetService.updateVet(id, vet)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteVet(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        if (vetService.deleteVet(id)) {
            response.put("success", true);
            response.put("message", "Vet deleted successfully");
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Vet not found");
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/available")
    public ResponseEntity<List<Vet>> getAvailableVets() {
        List<Vet> vets = vetService.getAvailableVets();
        return ResponseEntity.ok(vets);
    }

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<Vet>> getVetsBySpecialization(@PathVariable String specialization) {
        List<Vet> vets = vetService.getVetsBySpecialization(specialization);
        return ResponseEntity.ok(vets);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Vet>> searchVets(@RequestParam String q) {
        List<Vet> vets = vetService.searchVets(q);
        return ResponseEntity.ok(vets);
    }

    @GetMapping("/specializations")
    public ResponseEntity<List<String>> getAllSpecializations() {
        List<String> specializations = vetService.getAllSpecializations();
        return ResponseEntity.ok(specializations);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVets", vetService.getAllVets().size());
        stats.put("availableVets", vetService.getAvailableVets().size());
        stats.put("specializations", vetService.getAllSpecializations());
        return ResponseEntity.ok(stats);
    }
}
