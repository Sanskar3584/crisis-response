package com.crisis.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Our first endpoint. Proves the server boots and can answer HTTP.
 *
 * @RestController tells Spring: this class handles web requests, and whatever
 * a method returns should be written directly into the HTTP response body
 * (serialized to JSON automatically).
 */
@RestController
public class HealthController {

    // GET http://localhost:8080/health  ->  {"status":"OK"}
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "OK");
    }
}
