package com.crisis.incident;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

import org.springframework.data.mongodb.repository.Query;

public interface IncidentRepository extends MongoRepository<Incident, String> {
    List<Incident> findByVenueId(String venueId);
    @Query("{ 'venueId': ?0, 'archived': { $ne: true } }")
    List<Incident> findActiveByVenue(String venueId);
}