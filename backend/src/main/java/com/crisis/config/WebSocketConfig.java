package com.crisis.config;

import com.crisis.realtime.StompAuthChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    public WebSocketConfig(StompAuthChannelInterceptor stompAuthChannelInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");       // server -> client
        registry.setApplicationDestinationPrefixes("/app");    // client -> server
        registry.setUserDestinationPrefix("/user");            // private per-user queues
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // dev: allow any origin; access is checked on STOMP CONNECT
                .withSockJS();                   // fallback for older browsers
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Every frame a client sends (CONNECT, SUBSCRIBE, SEND) passes through this check.
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
