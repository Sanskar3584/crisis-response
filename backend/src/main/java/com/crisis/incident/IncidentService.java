package com.crisis.incident;

import com.crisis.user.Role;
import com.crisis.user.User;
import com.crisis.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final UserRepository userRepository;

    public IncidentService(IncidentRepository incidentRepository,
                           IncidentEventRepository incidentEventRepository,
                           UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.userRepository = userRepository;
    }

    public Incident report(String userId, CreateIncidentRequest request) {
        User user = currentUser(userId);

        Incident incident = new Incident();
        incident.setType(request.type());
        incident.setSeverity(request.severity());
        incident.setDescription(request.description());
        incident.setStatus(IncidentStatus.OPEN);
        incident.setVenueId(user.getVenueId());
        incident.setReportedBy(userId);
        incident.setCreatedAt(Instant.now());
        incident.setUpdatedAt(Instant.now());
        Incident saved = incidentRepository.save(incident);

        logEvent(saved, "CREATED", userId, "Incident created with status OPEN");
        return saved;
    }

    public List<Incident> listForVenue(String userId) {
        User user = currentUser(userId);
        return incidentRepository.findByVenueId(user.getVenueId());
    }

    public Incident updateStatus(String userId, String incidentId, IncidentStatus newStatus) {
        User user = currentUser(userId);

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));

        if (!incident.getVenueId().equals(user.getVenueId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your venue");
        }

        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(newStatus);
        incident.setUpdatedAt(Instant.now());
        Incident saved = incidentRepository.save(incident);

        logEvent(saved, "STATUS_CHANGED", userId, oldStatus + " -> " + newStatus);
        return saved;
    }

    public List<IncidentEvent> getEvents(String userId, String incidentId) {
        User user = currentUser(userId);

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));

        if (!incident.getVenueId().equals(user.getVenueId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your venue");
        }

        return incidentEventRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
    }

    private void logEvent(Incident incident, String type, String actorId, String detail) {
        IncidentEvent event = new IncidentEvent();
        event.setIncidentId(incident.getId());
        event.setVenueId(incident.getVenueId());
        event.setType(type);
        event.setActorId(actorId);
        event.setDetail(detail);
        event.setCreatedAt(Instant.now());
        incidentEventRepository.save(event);
    }

    private User currentUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }
}