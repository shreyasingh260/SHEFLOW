package com.sheflow.backend.service;

import com.sheflow.backend.entity.User;
import com.sheflow.backend.entity.WaterLog;
import com.sheflow.backend.repository.UserRepository;
import com.sheflow.backend.repository.WaterRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
public class WaterService {

    private final WaterRepository waterRepository;
    private final UserRepository userRepository;

    public WaterService(WaterRepository waterRepository, UserRepository userRepository) {
        this.waterRepository = waterRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Integer> getTodayWater(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int targetGoal = user.getWaterGoalGlasses() != null && user.getWaterGoalGlasses() > 0 
            ? user.getWaterGoalGlasses() 
            : 8;

        WaterLog log = waterRepository.findByUserIdAndLogDate(user.getId(), LocalDate.now())
            .orElseGet(() -> waterRepository.save(WaterLog.builder()
                .user(user)
                .logDate(LocalDate.now())
                .glassesConsumed(0)
                .glassesGoal(targetGoal)
                .build()));

        // Keep goal in sync if user updated their goal in onboarding or profile
        if (log.getGlassesGoal() == null || !log.getGlassesGoal().equals(targetGoal)) {
            log.setGlassesGoal(targetGoal);
            waterRepository.save(log);
        }

        return Map.of(
            "glassesConsumed", log.getGlassesConsumed(),
            "glassesGoal", log.getGlassesGoal()
        );
    }

    public Map<String, Integer> addWater(String email, int amountMl) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int targetGoal = user.getWaterGoalGlasses() != null && user.getWaterGoalGlasses() > 0 
            ? user.getWaterGoalGlasses() 
            : 8;

        WaterLog log = waterRepository.findByUserIdAndLogDate(user.getId(), LocalDate.now())
            .orElseGet(() -> WaterLog.builder()
                .user(user)
                .logDate(LocalDate.now())
                .glassesConsumed(0)
                .glassesGoal(targetGoal)
                .build());

        if (log.getGlassesGoal() == null || !log.getGlassesGoal().equals(targetGoal)) {
            log.setGlassesGoal(targetGoal);
        }

        int increment = amountMl >= 200 ? 1 : 1;
        log.setGlassesConsumed(log.getGlassesConsumed() + increment);
        waterRepository.save(log);

        return Map.of(
            "glassesConsumed", log.getGlassesConsumed(),
            "glassesGoal", log.getGlassesGoal()
        );
    }

    public Map<String, Integer> removeWater(String email, int amountMl) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int targetGoal = user.getWaterGoalGlasses() != null && user.getWaterGoalGlasses() > 0 
            ? user.getWaterGoalGlasses() 
            : 8;

        WaterLog log = waterRepository.findByUserIdAndLogDate(user.getId(), LocalDate.now())
            .orElseGet(() -> WaterLog.builder()
                .user(user)
                .logDate(LocalDate.now())
                .glassesConsumed(0)
                .glassesGoal(targetGoal)
                .build());

        if (log.getGlassesGoal() == null || !log.getGlassesGoal().equals(targetGoal)) {
            log.setGlassesGoal(targetGoal);
        }

        log.setGlassesConsumed(Math.max(0, log.getGlassesConsumed() - 1));
        waterRepository.save(log);

        return Map.of(
            "glassesConsumed", log.getGlassesConsumed(),
            "glassesGoal", log.getGlassesGoal()
        );
    }
}
