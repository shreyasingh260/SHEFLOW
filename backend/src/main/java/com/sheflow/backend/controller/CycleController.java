package com.sheflow.backend.controller;

import com.sheflow.backend.dto.ApiResponse;
import com.sheflow.backend.dto.CyclePredictionDto;
import com.sheflow.backend.service.CycleService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cycles")
public class CycleController {

    private final CycleService cycleService;

    public CycleController(CycleService cycleService) {
        this.cycleService = cycleService;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new BadCredentialsException("Authentication required to access cycle data");
        }
        return auth.getName();
    }

    @GetMapping("/prediction")
    public ResponseEntity<CyclePredictionDto> getPrediction(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(cycleService.calculatePrediction(email));
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse> startPeriod(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        cycleService.startPeriod(email);
        return ResponseEntity.ok(new ApiResponse("Period started successfully"));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(Authentication auth) {
        getAuthenticatedEmail(auth);
        return ResponseEntity.ok(Map.of(
            "averageCycleLengthDays", 28,
            "averagePeriodLengthDays", 5,
            "regularityLabel", "Regular",
            "history", List.of(
                Map.of("month", "March 2026", "cycleLengthDays", 28),
                Map.of("month", "April 2026", "cycleLengthDays", 29),
                Map.of("month", "May 2026", "cycleLengthDays", 27),
                Map.of("month", "June 2026", "cycleLengthDays", 28)
            )
        ));
    }
}
