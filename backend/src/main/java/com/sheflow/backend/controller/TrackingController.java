package com.sheflow.backend.controller;

import com.sheflow.backend.dto.ApiResponse;
import com.sheflow.backend.entity.Medication;
import com.sheflow.backend.entity.MoodLog;
import com.sheflow.backend.entity.SymptomLog;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.MedicationRepository;
import com.sheflow.backend.repository.MoodRepository;
import com.sheflow.backend.repository.SymptomRepository;
import com.sheflow.backend.repository.UserRepository;
import com.sheflow.backend.service.WaterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TrackingController {

    private final WaterService waterService;
    private final SymptomRepository symptomRepository;
    private final MoodRepository moodRepository;
    private final MedicationRepository medicationRepository;
    private final UserRepository userRepository;

    public TrackingController(
        WaterService waterService,
        SymptomRepository symptomRepository,
        MoodRepository moodRepository,
        MedicationRepository medicationRepository,
        UserRepository userRepository
    ) {
        this.waterService = waterService;
        this.symptomRepository = symptomRepository;
        this.moodRepository = moodRepository;
        this.medicationRepository = medicationRepository;
        this.userRepository = userRepository;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new BadCredentialsException("Authentication required to access tracking data");
        }
        return auth.getName();
    }

    // WATER
    @GetMapping("/water/today")
    public ResponseEntity<Map<String, Integer>> getTodayWater(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(waterService.getTodayWater(email));
    }

    @PostMapping("/water/add")
    public ResponseEntity<Map<String, Integer>> addWater(Authentication auth, @RequestBody(required = false) Map<String, Integer> body) {
        String email = getAuthenticatedEmail(auth);
        int amount = body != null && body.containsKey("amountMl") ? body.get("amountMl") : 250;
        return ResponseEntity.ok(waterService.addWater(email, amount));
    }

    @PostMapping("/water/remove")
    public ResponseEntity<Map<String, Integer>> removeWater(Authentication auth, @RequestBody(required = false) Map<String, Integer> body) {
        String email = getAuthenticatedEmail(auth);
        int amount = body != null && body.containsKey("amountMl") ? body.get("amountMl") : 250;
        return ResponseEntity.ok(waterService.removeWater(email, amount));
    }

    // SYMPTOMS
    @PostMapping("/symptoms")
    public ResponseEntity<ApiResponse> logSymptoms(Authentication auth, @RequestBody Map<String, Object> body) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();

        symptomRepository.save(SymptomLog.builder()
            .user(user)
            .logDate(LocalDate.now())
            .symptomsJson(body.get("symptoms") != null ? body.get("symptoms").toString() : "[]")
            .severity(body.get("severity") != null ? body.get("severity").toString() : "MILD")
            .notes(body.get("notes") != null ? body.get("notes").toString() : "")
            .build());

        return ResponseEntity.ok(new ApiResponse("Symptoms recorded successfully"));
    }

    @GetMapping("/symptoms")
    public ResponseEntity<List<SymptomLog>> getSymptoms(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(symptomRepository.findByUserIdOrderByLogDateDesc(user.getId()));
    }

    // MOODS
    @PostMapping("/moods")
    public ResponseEntity<ApiResponse> logMood(Authentication auth, @RequestBody Map<String, Object> body) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();

        int intensity = 3;
        if (body.get("intensity") != null) {
            intensity = Integer.parseInt(body.get("intensity").toString());
        }

        moodRepository.save(MoodLog.builder()
            .user(user)
            .logDate(LocalDate.now())
            .moodsJson(body.get("moods") != null ? body.get("moods").toString() : "[]")
            .intensity(intensity)
            .notes(body.get("notes") != null ? body.get("notes").toString() : "")
            .build());

        return ResponseEntity.ok(new ApiResponse("Mood logged successfully"));
    }

    @GetMapping("/moods")
    public ResponseEntity<List<MoodLog>> getMoods(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(moodRepository.findByUserIdOrderByLogDateDesc(user.getId()));
    }

    // MEDICATIONS
    @GetMapping("/medications")
    public ResponseEntity<List<Medication>> getMedications(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(medicationRepository.findByUserIdOrderByIdAsc(user.getId()));
    }

    @PostMapping("/medications")
    public ResponseEntity<ApiResponse> addMedication(Authentication auth, @RequestBody Medication med) {
        String email = getAuthenticatedEmail(auth);
        User user = userRepository.findByEmail(email).orElseThrow();
        med.setUser(user);
        medicationRepository.save(med);
        return ResponseEntity.ok(new ApiResponse("Medication added"));
    }
}
