package com.datavet.petservice.repository;

import com.datavet.petservice.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VetRepository extends JpaRepository<Vet, Long> {

    List<Vet> findByAvailable(Boolean available);

    List<Vet> findBySpecialization(String specialization);

    List<Vet> findByNameContainingIgnoreCase(String name);

    @Query("SELECT v FROM Vet v WHERE " +
           "LOWER(v.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.specialization) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Vet> searchVets(@Param("query") String query);

    @Query("SELECT DISTINCT v.specialization FROM Vet v")
    List<String> getAllSpecializations();
}
