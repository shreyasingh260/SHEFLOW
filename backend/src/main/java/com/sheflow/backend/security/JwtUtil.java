package com.sheflow.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtUtil(
        @Value("${app.jwt.secret:sheflow-super-secret-jwt-key-for-womens-health-companion-2026-production}") String secret,
        @Value("${app.jwt.expiration-ms:900000}") long expirationMs,
        @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(String email) {
        return Jwts.builder()
            .subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact();
    }

    public String generateRefreshToken(String email) {
        return Jwts.builder()
            .subject(email)
            .claim("type", "REFRESH")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
            .signWith(key)
            .compact();
    }

    public String generateResetToken(String email) {
        // Reset token valid for 5 minutes (300,000 ms)
        return Jwts.builder()
            .subject(email)
            .claim("type", "PASSWORD_RESET")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 300000))
            .signWith(key)
            .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean validateToken(String token, String email) {
        try {
            String extracted = extractEmail(token);
            return extracted.equals(email) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public String validateRefreshToken(String token) {
        try {
            Claims claims = getAllClaims(token);
            if (isTokenExpired(token)) return null;
            String type = claims.get("type", String.class);
            if (!"REFRESH".equals(type)) return null;
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public String validateResetToken(String token) {
        try {
            Claims claims = getAllClaims(token);
            if (isTokenExpired(token)) return null;
            String type = claims.get("type", String.class);
            if (!"PASSWORD_RESET".equals(type)) return null;
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    private Claims getAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claimsResolver.apply(claims);
    }
}
