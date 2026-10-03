package com.crisis.realtime;

import com.crisis.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    private static final StompPrincipal STAFF = new StompPrincipal("staff-1", "STAFF", "venue-1");
    private static final StompPrincipal GUEST = new StompPrincipal("guest-1", "GUEST", "venue-1");

    @Mock JwtService jwtService;
    @Mock MessageChannel channel;

    private StompAuthChannelInterceptor interceptor() {
        return new StompAuthChannelInterceptor(jwtService);
    }

    /** Builds an inbound STOMP frame the way Spring hands it to the interceptor. */
    private static Message<byte[]> frame(StompCommand command, StompPrincipal user,
                                         String destination, String authorization) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (user != null) accessor.setUser(user);
        if (destination != null) accessor.setDestination(destination);
        if (authorization != null) accessor.setNativeHeader("Authorization", authorization);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void connect_withoutToken_isRejected() {
        assertThatThrownBy(() -> interceptor().preSend(frame(StompCommand.CONNECT, null, null, null), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void connect_withInvalidToken_isRejected() {
        when(jwtService.parseClaims("expired-token")).thenThrow(new JwtException("expired"));

        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.CONNECT, null, null, "Bearer expired-token"), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void connect_withValidToken_attachesTheVenueScopedUser() {
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("staff-1");
        when(claims.get("role", String.class)).thenReturn("STAFF");
        when(claims.get("venueId", String.class)).thenReturn("venue-1");
        when(jwtService.parseClaims("good-token")).thenReturn(claims);

        Message<byte[]> connect = frame(StompCommand.CONNECT, null, null, "Bearer good-token");
        interceptor().preSend(connect, channel);

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(connect, StompHeaderAccessor.class);
        assertThat(accessor.getUser()).isEqualTo(STAFF);
    }

    @Test
    void staff_canWatchTheirOwnVenueBoard() {
        assertThatCode(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, STAFF, "/topic/venue/venue-1", null), channel))
                .doesNotThrowAnyException();
    }

    @Test
    void staff_cannotWatchAnotherVenue() {
        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, STAFF, "/topic/venue/venue-2", null), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void guests_onlyGetTheirOwnReports() {
        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, GUEST, "/topic/venue/venue-1", null), channel))
                .isInstanceOf(AccessDeniedException.class);

        assertThatCode(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, GUEST, "/user/queue/incidents", null), channel))
                .doesNotThrowAnyException();
    }

    @Test
    void subscribing_withoutConnectingFirst_isRejected() {
        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, null, "/topic/venue/venue-1", null), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void subscribing_toAnotherSessionsPrivateQueue_isRejected() {
        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.SUBSCRIBE, STAFF, "/queue/incidents-user1a2b3c", null), channel))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void clients_cannotPublishFakeIncidents() {
        assertThatThrownBy(() -> interceptor().preSend(
                frame(StompCommand.SEND, STAFF, "/topic/venue/venue-1", null), channel))
                .isInstanceOf(AccessDeniedException.class);
    }
}
