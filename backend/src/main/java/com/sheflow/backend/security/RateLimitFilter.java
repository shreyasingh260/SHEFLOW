package com.sheflow.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding Window Token-Bucket Rate Limiter for Authentication Endpoints.
 * Defends against brute-force password guessing, credential stuffing, and OTP flooding.
 * Limit: 30 requests per minute per IP for /api/v1/auth/**.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private static final long WINDOW_MS = 60_000L;

    private static class ClientBucket {
        int count;
        long windowStart;

        ClientBucket(long now) {
            this.count = 1;
            this.windowStart = now;
        }
    }

    private final Map<String, ClientBucket> ipBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only rate-limit public authentication endpoints
        if (path.startsWith("/api/v1/auth/")) {
            String clientIp = getClientIp(request);
            long now = System.currentTimeMillis();

            ClientBucket bucket = ipBuckets.compute(clientIp, (ip, b) -> {
                if (b == null || (now - b.windowStart) > WINDOW_MS) {
                    return new ClientBucket(now);
                } else {
                    b.count++;
                    return b;
                }
            });

            if (bucket.count > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Too many authentication requests. Please try again in 1 minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
