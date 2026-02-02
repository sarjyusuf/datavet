package com.datavet.petservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PetServiceApplication {

    public static void main(String[] args) {
        System.out.println("""
            
            ╔════════════════════════════════════════════════════════════════╗
            ║                                                                ║
            ║   🐾 DATAVET PET SERVICE STARTING... 🐾                        ║
            ║                                                                ║
            ╚════════════════════════════════════════════════════════════════╝
            """);
        SpringApplication.run(PetServiceApplication.class, args);
        System.out.println("""
            
            ╔════════════════════════════════════════════════════════════════╗
            ║   🎮 PET SERVICE ONLINE - PORT 8080                            ║
            ║   Ready to manage your furry friends!                          ║
            ╚════════════════════════════════════════════════════════════════╝
            """);
    }
}
