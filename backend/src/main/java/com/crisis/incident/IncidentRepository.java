package com.crisis.incident;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface IncidentRepository extends MongoRepository<Incident, String> {

    List<Incident> findByVenueId(String venueId);
}