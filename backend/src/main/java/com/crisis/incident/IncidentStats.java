package com.crisis.incident;

public record IncidentStats(
        long open,
        long resolved,
        long myReports,
        Double avgResolutionMinutes
) {}
