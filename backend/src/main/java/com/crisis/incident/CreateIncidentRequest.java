package com.crisis.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateIncidentRequest(
        @NotNull IncidentType type,
        @NotNull Severity severity,
        String description
) {}