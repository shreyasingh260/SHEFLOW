package com.sheflow.backend.service;

import com.sheflow.backend.dto.CyclePredictionDto;
import com.sheflow.backend.entity.PeriodLog;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.PeriodLogRepository;
import com.sheflow.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class CycleService {

    private final PeriodLogRepository periodLogRepository;
    private final UserRepository userRepository;

    public CycleService(PeriodLogRepository periodLogRepository, UserRepository userRepository) {
        this.periodLogRepository = periodLogRepository;
        this.userRepository = userRepository;
    }

    public CyclePredictionDto calculatePrediction(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<PeriodLog> logs = periodLogRepository.findByUserIdOrderByStartDateDesc(user.getId());

        int cycleLength = user.getCycleLengthDays() != null ? user.getCycleLengthDays() : 28;
        LocalDate lastPeriod = user.getLastPeriodStart() != null ? user.getLastPeriodStart() : LocalDate.now().minusDays(14);

        if (!logs.isEmpty()) {
            lastPeriod = logs.get(0).getStartDate();

            // Calculate weighted average if multiple cycles are available
            if (logs.size() >= 3) {
                long c1 = ChronoUnit.DAYS.between(logs.get(1).getStartDate(), logs.get(0).getStartDate());
                long c2 = ChronoUnit.DAYS.between(logs.get(2).getStartDate(), logs.get(1).getStartDate());
                if (c1 > 18 && c1 < 45 && c2 > 18 && c2 < 45) {
                    // Weighted: most recent has 60% weight, previous has 40%
                    cycleLength = (int) Math.round((c1 * 0.6) + (c2 * 0.4));
                }
            }
        }

        LocalDate today = LocalDate.now();
        int currentCycleDay = (int) ChronoUnit.DAYS.between(lastPeriod, today) + 1;
        if (currentCycleDay < 1) currentCycleDay = 1;

        LocalDate nextPeriodDate = lastPeriod.plusDays(cycleLength);
        int daysUntilNext = (int) ChronoUnit.DAYS.between(today, nextPeriodDate);
        if (daysUntilNext < 0) daysUntilNext = 0;

        // Ovulation occurs approximately 14 days before next period
        LocalDate ovulationDate = nextPeriodDate.minusDays(14);
        LocalDate fertileStart = ovulationDate.minusDays(5);
        LocalDate fertileEnd = ovulationDate.plusDays(1);

        String phase = "Follicular Phase";
        if (currentCycleDay <= (user.getPeriodLengthDays() != null ? user.getPeriodLengthDays() : 5)) {
            phase = "Menstrual Phase (Period)";
        } else if (today.isEqual(ovulationDate) || (currentCycleDay >= 13 && currentCycleDay <= 15)) {
            phase = "Ovulation Phase";
        } else if (!today.isBefore(fertileStart) && !today.isAfter(fertileEnd)) {
            phase = "Fertile Window";
        } else if (today.isAfter(ovulationDate)) {
            phase = "Luteal Phase";
        }

        return CyclePredictionDto.builder()
            .nextPeriodDate(nextPeriodDate)
            .ovulationDate(ovulationDate)
            .fertileWindowStart(fertileStart)
            .fertileWindowEnd(fertileEnd)
            .predictedCycleLength(cycleLength)
            .currentCycleDay(currentCycleDay)
            .daysUntilNextPeriod(daysUntilNext)
            .cyclePhase(phase)
            .isIrregular("IRREGULAR".equalsIgnoreCase(user.getRegularity()))
            .build();
    }

    public void startPeriod(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setLastPeriodStart(LocalDate.now());
        userRepository.save(user);

        periodLogRepository.save(PeriodLog.builder()
            .user(user)
            .startDate(LocalDate.now())
            .flowIntensity("MEDIUM")
            .notes("Logged via Quick Actions")
            .build());
    }
}
