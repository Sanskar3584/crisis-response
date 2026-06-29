package com.crisis.incident;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface IncidentEventRepository extends MongoRepository<IncidentEvent, String> {

    List<IncidentEvent> findByIncidentIdOrderByCreatedAtAsc(String incidentId);
}