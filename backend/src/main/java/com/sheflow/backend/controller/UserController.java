package com.sheflow.backend.controller;

import com.sheflow.backend.entity.User;
import com.sheflow.backend.entity.PeriodLog;
import com.sheflow.backend.repository.UserRepository;
import com.sheflow.backend.repository.PeriodLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final PeriodLogRepository periodLogRepository;

    public UserController(UserRepository userRepository, PeriodLogRepository periodLogRepository) {
        this.userRepository = userRepository;
        this.periodLogRepository = periodLogRepository;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new BadCredentialsException("Unauthenticated: missing or invalid credentials");
        }
        return auth.getName();
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", user.getId());
        resp.put("fullName", user.getFullName());
        resp.put("email", user.getEmail());
        resp.put("dateOfBirth", user.getDateOfBirth());
        resp.put("cycleLengthDays", user.getCycleLengthDays());
        resp.put("periodLengthDays", user.getPeriodLengthDays());
        resp.put("lastPeriodStart", user.getLastPeriodStart());
        resp.put("regularity", user.getRegularity());
        resp.put("onBirthControl", user.getOnBirthControl());
        resp.put("waterGoal", user.getWaterGoalGlasses());
        resp.put("weightKg", user.getWeightKg() != null ? user.getWeightKg() : 55.0);
        resp.put("heightCm", user.getHeightCm() != null ? user.getHeightCm() : 162.0);
        resp.put("dailyProteinGrams", user.getDailyProteinGrams() != null ? user.getDailyProteinGrams() : 60);
        resp.put("emergencyContacts", user.getEmergencyContacts());
        resp.put("onboardingDone", Boolean.TRUE.equals(user.getOnboardingDone()));

        return ResponseEntity.ok(resp);
    }

    /**
     * POST /api/v1/users/onboarding
     * Called after signup — saves cycle info entered by the user and marks onboarding complete.
     * Body: { lastPeriodStart, cycleLengthDays, periodLengthDays, regularity, onBirthControl, waterGoal, flowIntensity }
     */
    @PostMapping("/onboarding")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> completeOnboarding(
            Authentication auth,
            @RequestBody Map<String, Object> body) {

        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Save cycle fields from user input
        if (body.containsKey("lastPeriodStart") && body.get("lastPeriodStart") != null) {
            user.setLastPeriodStart(LocalDate.parse(body.get("lastPeriodStart").toString()));
        }
        if (body.containsKey("cycleLengthDays")) {
            user.setCycleLengthDays(Integer.parseInt(body.get("cycleLengthDays").toString()));
        }
        if (body.containsKey("periodLengthDays")) {
            user.setPeriodLengthDays(Integer.parseInt(body.get("periodLengthDays").toString()));
        }
        if (body.containsKey("regularity")) {
            user.setRegularity(body.get("regularity").toString());
        }
        if (body.containsKey("onBirthControl")) {
            user.setOnBirthControl(Boolean.parseBoolean(body.get("onBirthControl").toString()));
        }
        if (body.containsKey("waterGoal")) {
            user.setWaterGoalGlasses(Integer.parseInt(body.get("waterGoal").toString()));
        }
        if (body.containsKey("weightKg") && body.get("weightKg") != null) {
            user.setWeightKg(Double.parseDouble(body.get("weightKg").toString()));
        }
        if (body.containsKey("heightCm") && body.get("heightCm") != null) {
            user.setHeightCm(Double.parseDouble(body.get("heightCm").toString()));
        }
        if (body.containsKey("dailyProteinGrams") && body.get("dailyProteinGrams") != null) {
            user.setDailyProteinGrams(Integer.parseInt(body.get("dailyProteinGrams").toString()));
        } else if (user.getWeightKg() != null && user.getWeightKg() > 0) {
            user.setDailyProteinGrams((int) Math.round(user.getWeightKg() * 1.1));
        }

        // Mark onboarding complete
        user.setOnboardingDone(true);
        if (body.containsKey("emergencyContacts")) {
            user.setEmergencyContacts(body.get("emergencyContacts") != null ? body.get("emergencyContacts").toString() : null);
        }
        userRepository.save(user);

        // Also create the first period log entry from lastPeriodStart
        if (user.getLastPeriodStart() != null) {
            String flow = body.containsKey("flowIntensity") ? body.get("flowIntensity").toString() : "MEDIUM";
            LocalDate endDate = user.getLastPeriodStart().plusDays(user.getPeriodLengthDays() - 1);

            // Only create if no log exists yet
            boolean noPriorLogs = periodLogRepository.findByUserIdOrderByStartDateDesc(user.getId()).isEmpty();
            if (noPriorLogs) {
                periodLogRepository.save(PeriodLog.builder()
                    .user(user)
                    .startDate(user.getLastPeriodStart())
                    .endDate(endDate)
                    .flowIntensity(flow)
                    .notes("First period logged during onboarding")
                    .build());
            }
        }

        return getCurrentUser(auth);
    }

    @PatchMapping("/me")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> updateCurrentUser(
            Authentication auth,
            @RequestBody Map<String, Object> updates) {

        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (updates.containsKey("fullName")) user.setFullName(updates.get("fullName").toString());
        if (updates.containsKey("cycleLengthDays")) user.setCycleLengthDays(Integer.parseInt(updates.get("cycleLengthDays").toString()));
        if (updates.containsKey("periodLengthDays")) user.setPeriodLengthDays(Integer.parseInt(updates.get("periodLengthDays").toString()));
        if (updates.containsKey("regularity")) user.setRegularity(updates.get("regularity").toString());
        if (updates.containsKey("onBirthControl")) user.setOnBirthControl(Boolean.parseBoolean(updates.get("onBirthControl").toString()));
        if (updates.containsKey("waterGoal")) user.setWaterGoalGlasses(Integer.parseInt(updates.get("waterGoal").toString()));
        if (updates.containsKey("weightKg")) user.setWeightKg(Double.parseDouble(updates.get("weightKg").toString()));
        if (updates.containsKey("heightCm")) user.setHeightCm(Double.parseDouble(updates.get("heightCm").toString()));
        if (updates.containsKey("dailyProteinGrams")) {
            user.setDailyProteinGrams(Integer.parseInt(updates.get("dailyProteinGrams").toString()));
        } else if (updates.containsKey("weightKg")) {
            user.setDailyProteinGrams((int) Math.round(user.getWeightKg() * 1.1));
        }
        if (updates.containsKey("emergencyContacts")) {
            user.setEmergencyContacts(updates.get("emergencyContacts") != null ? updates.get("emergencyContacts").toString() : null);
        }
        userRepository.save(user);

        return getCurrentUser(auth);
    }
}
