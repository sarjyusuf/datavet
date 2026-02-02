package com.datavet.petservice.repository;

import com.datavet.petservice.model.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {

    List<Pet> findBySpecies(Pet.Species species);

    List<Pet> findByOwnerNameContainingIgnoreCase(String ownerName);

    List<Pet> findByNameContainingIgnoreCase(String name);

    @Query("SELECT p FROM Pet p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.breed) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.ownerName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Pet> searchPets(@Param("query") String query);

    @Query("SELECT p.species, COUNT(p) FROM Pet p GROUP BY p.species ORDER BY COUNT(p) DESC")
    List<Object[]> getSpeciesStatistics();
}
