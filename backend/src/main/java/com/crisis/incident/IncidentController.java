package com.crisis.incident;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    public Incident report(@AuthenticationPrincipal String userId,
                           @Valid @RequestBody CreateIncidentRequest request) {
        return incidentService.report(userId, request);
    }

    @GetMapping
    public List<Incident> list(@AuthenticationPrincipal String userId) {
        return incidentService.listForVenue(userId);
    }
    @PatchMapping("/{id}/status")
    public Incident updateStatus(@AuthenticationPrincipal String userId,
                                 @PathVariable String id,
                                 @Valid @RequestBody UpdateStatusRequest request) {
        return incidentService.updateStatus(userId, id, request.status());
    }
    @PatchMapping("/{id}/archive")
    public Incident archive(@AuthenticationPrincipal String userId, @PathVariable String id) {
        return incidentService.archive(userId, id);
    }
    @GetMapping("/{id}/events")
    public List<IncidentEvent> getEvents(@AuthenticationPrincipal String userId,
                                         @PathVariable String id) {
        return incidentService.getEvents(userId, id);
    }

    @GetMapping("/stats")
    public IncidentStats stats(@AuthenticationPrincipal String userId) {
        return incidentService.stats(userId);
    }
}
