package com.datavet.petservice;

import com.datavet.petservice.model.Pet;
import com.datavet.petservice.model.Vet;
import com.datavet.petservice.repository.PetRepository;
import com.datavet.petservice.repository.VetRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final PetRepository petRepository;
    private final VetRepository vetRepository;

    public DataLoader(PetRepository petRepository, VetRepository vetRepository) {
        this.petRepository = petRepository;
        this.vetRepository = vetRepository;
    }

    @Override
    public void run(String... args) {
        // Load sample pet data
        if (petRepository.count() == 0) {
            System.out.println("Loading sample pet data...");
            
            petRepository.save(new Pet("Max", Pet.Species.DOG, "Golden Retriever", 5, "John Smith"));
            petRepository.save(new Pet("Whiskers", Pet.Species.CAT, "Persian", 3, "Jane Doe"));
            petRepository.save(new Pet("Buddy", Pet.Species.DOG, "Labrador", 2, "Bob Wilson"));
            petRepository.save(new Pet("Tweety", Pet.Species.BIRD, "Canary", 1, "Alice Brown"));
            petRepository.save(new Pet("Snowball", Pet.Species.RABBIT, "Holland Lop", 2, "Charlie Davis"));
            petRepository.save(new Pet("Nemo", Pet.Species.FISH, "Clownfish", 1, "Eva Martinez"));
            petRepository.save(new Pet("Rocky", Pet.Species.DOG, "German Shepherd", 4, "Frank Johnson"));
            petRepository.save(new Pet("Luna", Pet.Species.CAT, "Siamese", 2, "Grace Lee"));
            
            System.out.println("Sample pet data loaded: " + petRepository.count() + " pets");
        }

        // Load sample vet data
        if (vetRepository.count() == 0) {
            System.out.println("Loading sample vet data...");
            
            Vet vet1 = new Vet("Dr. Sarah Mitchell", "GENERAL_PRACTICE", "sarah.mitchell@datavet.com", "555-0101");
            vet1.setBio("Experienced general practitioner with 15 years of experience in small animal care.");
            vet1.setWorkingHoursStart("08:00");
            vet1.setWorkingHoursEnd("16:00");
            vet1.setSlotDurationMinutes(30);
            vetRepository.save(vet1);

            Vet vet2 = new Vet("Dr. James Rodriguez", "SURGERY", "james.rodriguez@datavet.com", "555-0102");
            vet2.setBio("Board-certified veterinary surgeon specializing in orthopedic procedures.");
            vet2.setWorkingHoursStart("09:00");
            vet2.setWorkingHoursEnd("17:00");
            vet2.setSlotDurationMinutes(60);
            vetRepository.save(vet2);

            Vet vet3 = new Vet("Dr. Emily Chen", "DENTISTRY", "emily.chen@datavet.com", "555-0103");
            vet3.setBio("Dental specialist focusing on preventive care and oral surgery.");
            vet3.setWorkingHoursStart("10:00");
            vet3.setWorkingHoursEnd("18:00");
            vet3.setSlotDurationMinutes(45);
            vetRepository.save(vet3);

            Vet vet4 = new Vet("Dr. Michael Thompson", "EMERGENCY", "michael.thompson@datavet.com", "555-0104");
            vet4.setBio("Emergency medicine specialist available for critical care.");
            vet4.setWorkingHoursStart("06:00");
            vet4.setWorkingHoursEnd("14:00");
            vet4.setWorkingDays("MON,TUE,WED,THU,FRI,SAT,SUN");
            vet4.setSlotDurationMinutes(30);
            vetRepository.save(vet4);

            Vet vet5 = new Vet("Dr. Lisa Park", "DERMATOLOGY", "lisa.park@datavet.com", "555-0105");
            vet5.setBio("Dermatology expert treating skin conditions, allergies, and coat problems.");
            vet5.setWorkingHoursStart("09:00");
            vet5.setWorkingHoursEnd("17:00");
            vet5.setSlotDurationMinutes(30);
            vetRepository.save(vet5);

            Vet vet6 = new Vet("Dr. Robert Williams", "EXOTIC_ANIMALS", "robert.williams@datavet.com", "555-0106");
            vet6.setBio("Specialist in exotic pets including reptiles, birds, and small mammals.");
            vet6.setWorkingHoursStart("10:00");
            vet6.setWorkingHoursEnd("18:00");
            vet6.setWorkingDays("TUE,WED,THU,FRI,SAT");
            vet6.setSlotDurationMinutes(45);
            vetRepository.save(vet6);

            System.out.println("Sample vet data loaded: " + vetRepository.count() + " vets");
        }
    }
}
