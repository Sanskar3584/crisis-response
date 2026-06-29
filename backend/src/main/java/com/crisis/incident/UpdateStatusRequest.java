package com.crisis.incident;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull IncidentStatus status
) {}