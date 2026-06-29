package com.crisis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * The entry point of the whole backend.
 *
 * @SpringBootApplication is three annotations in one:
 *   - @Configuration            : this class can define beans (wiring)
 *   - @EnableAutoConfiguration  : turn on Spring Boot's "guess sensible defaults"
 *   - @ComponentScan            : scan THIS package and sub-packages for components
 *                                 (controllers, services, etc.) and register them
 *
 * Because component scanning starts here, every class we write lives under
 * com.crisis.* so Spring can find it automatically.
 */
@SpringBootApplication
public class CrisisApplication {

    public static void main(String[] args) {
        // Boots the embedded Tomcat server and starts the application.
        SpringApplication.run(CrisisApplication.class, args);
    }
}
