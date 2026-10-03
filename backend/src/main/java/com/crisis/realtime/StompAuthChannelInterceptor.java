package com.crisis.realtime;

import com.crisis.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Guards the WebSocket (STOMP) channel. The HTTP security chain lets the /ws handshake
 * through, so every STOMP frame a client sends is checked here instead:
 * - CONNECT must carry a valid JWT in an "Authorization: Bearer ..." header.
 * - SUBSCRIBE: staff, managers and admins may only watch their own venue's board. Anyone may
 *   subscribe to their private queue, which only carries the incidents they reported.
 * - SEND: clients may not publish to the broker's destinations, so they can't fake incidents.
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    static final String VENUE_TOPIC_PREFIX = "/topic/venue/";
    static final String OWN_REPORTS_QUEUE = "/user/queue/incidents";

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message; // heartbeats and other non-STOMP frames
        }

        switch (accessor.getCommand()) {
            case CONNECT, STOMP -> accessor.setUser(authenticate(accessor.getFirstNativeHeader("Authorization")));
            case SUBSCRIBE -> authorizeSubscribe(currentUser(accessor), accessor.getDestination());
            case SEND -> {
                currentUser(accessor);
                authorizeSend(accessor.getDestination());
            }
            default -> { }
        }
        return message;
    }

    private StompPrincipal authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new AccessDeniedException("Missing token");
        }
        Claims claims;
        try {
            claims = jwtService.parseClaims(authorization.substring(7));
        } catch (JwtException | IllegalArgumentException e) {
            throw new AccessDeniedException("Invalid or expired token");
        }
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);
        if (userId == null || role == null) {
            throw new AccessDeniedException("Token has no user or role");
        }
        return new StompPrincipal(userId, role, claims.get("venueId", String.class));
    }

    private static StompPrincipal currentUser(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof StompPrincipal user) {
            return user;
        }
        throw new AccessDeniedException("Not authenticated");
    }

    private static void authorizeSubscribe(StompPrincipal user, String destination) {
        if (OWN_REPORTS_QUEUE.equals(destination)) {
            return;
        }
        boolean ownVenueBoard = user.venueId() != null
                && (VENUE_TOPIC_PREFIX + user.venueId()).equals(destination);
        if (ownVenueBoard && !user.isGuest()) {
            return;
        }
        throw new AccessDeniedException("Not allowed to subscribe to " + destination);
    }

    private static void authorizeSend(String destination) {
        // Only application endpoints (/app/...) accept client messages; the broker's
        // /topic and /queue destinations are written by the server alone.
        if (destination == null || !destination.startsWith("/app/")) {
            throw new AccessDeniedException("Clients cannot publish to " + destination);
        }
    }
}
