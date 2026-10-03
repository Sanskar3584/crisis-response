package com.crisis.realtime;

import java.security.Principal;

/** The user behind a STOMP session, read from the JWT sent with the CONNECT frame. */
public record StompPrincipal(String userId, String role, String venueId) implements Principal {

    @Override
    public String getName() {
        return userId; // lets convertAndSendToUser(userId, ...) reach this user's sessions
    }

    public boolean isGuest() {
        return "GUEST".equals(role);
    }
}
