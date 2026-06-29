package com.crisis.auth;

import com.crisis.user.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    // @Value injects values from application.properties
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)            // checks the signature using our secret
                .build()
                .parseSignedClaims(token)
                .getPayload();              // returns the claims (sub, role, etc.)
    }
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getId())              // "sub" = who the token is about
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("venueId", user.getVenueId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)                      // sign with our secret
                .compact();                         // build the final token string
    }
}