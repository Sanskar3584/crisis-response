package com.crisis.auth;

import com.crisis.user.Role;

public record RegisterRequest(
        String email,
        String password,
        String displayName,
        Role role,
        String venueId
) {}