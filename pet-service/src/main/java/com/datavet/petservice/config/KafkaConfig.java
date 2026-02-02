package com.datavet.petservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic petEventsTopic() {
        return TopicBuilder.name("pet-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic appointmentEventsTopic() {
        return TopicBuilder.name("appointment-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name("notifications")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
