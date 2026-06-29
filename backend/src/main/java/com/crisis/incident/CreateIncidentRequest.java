package com.crisis.incident;

public record CreateIncidentRequest(
        IncidentType type,
        Severity severity,
        String description
) {}