package com.sheflow.backend.flora;

import com.sheflow.backend.dto.CyclePredictionDto;
import com.sheflow.backend.entity.MoodLog;
import com.sheflow.backend.entity.SymptomLog;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.entity.WaterLog;
import com.sheflow.backend.repository.MoodRepository;
import com.sheflow.backend.repository.SymptomRepository;
import com.sheflow.backend.repository.WaterRepository;
import com.sheflow.backend.service.CycleService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FloraUserContextService {

    private final CycleService cycleService;
    private final SymptomRepository symptomRepository;
    private final MoodRepository moodRepository;
    private final WaterRepository waterRepository;

    public FloraUserContextService(
        CycleService cycleService,
        SymptomRepository symptomRepository,
        MoodRepository moodRepository,
        WaterRepository waterRepository
    ) {
        this.cycleService = cycleService;
        this.symptomRepository = symptomRepository;
        this.moodRepository = moodRepository;
        this.waterRepository = waterRepository;
    }

    public record AnonymizedUserCycleContext(
        String cyclePhase,
        int currentCycleDay,
        int daysUntilNextPeriod,
        String predictedNextPeriodDate,
        String estimatedOvulationDate,
        String estimatedFertileWindow,
        boolean isIrregular,
        int cycleLengthDays,
        int periodLengthDays,
        String lastRecordedPeriodStart,
        List<String> recentSymptoms,
        String recentMood,
        String hydrationSummary
    ) {
        public String toPromptString() {
            StringBuilder sb = new StringBuilder();
            sb.append("--- USER CLINICAL CONTEXT (ANONYMIZED PHYSIOLOGICAL DATA) ---\n");
            sb.append("• Recorded Data:\n");
            sb.append("  - Last Period Start: ").append(lastRecordedPeriodStart != null ? lastRecordedPeriodStart : "Not recorded").append("\n");
            sb.append("  - Recent Symptoms: ").append(recentSymptoms.isEmpty() ? "None logged recently" : String.join(", ", recentSymptoms)).append("\n");
            sb.append("  - Recent Mood: ").append(recentMood != null ? recentMood : "Not logged").append("\n");
            sb.append("  - Hydration: ").append(hydrationSummary).append("\n");
            sb.append("• Calculated Data:\n");
            sb.append("  - Current Cycle Day: Day ").append(currentCycleDay).append("\n");
            sb.append("  - Typical Cycle Length: ").append(cycleLengthDays).append(" days\n");
            sb.append("  - Period Duration: ").append(periodLengthDays).append(" days\n");
            sb.append("• Estimated Calculations (Statistical algorithm, NOT medical confirmation):\n");
            sb.append("  - Estimated Phase: ").append(cyclePhase).append("\n");
            sb.append("  - Predicted Next Period: ").append(predictedNextPeriodDate).append(" (~").append(daysUntilNextPeriod).append(" days away)\n");
            sb.append("  - Estimated Fertile Window: ").append(estimatedFertileWindow).append("\n");
            sb.append("  - Cycle Regularity: ").append(isIrregular ? "Irregular variations reported" : "Generally regular").append("\n");
            sb.append("-----------------------------------------------------------\n");
            return sb.toString();
        }
    }

    public AnonymizedUserCycleContext buildUserContext(User user) {
        // Single source of truth for predictions
        CyclePredictionDto prediction = cycleService.calculatePrediction(user.getEmail());

        // Gather recent symptoms (last 5)
        List<SymptomLog> symptoms = symptomRepository.findByUserIdOrderByLogDateDesc(user.getId());
        List<String> recentSymptoms = symptoms.stream()
            .limit(5)
            .map(s -> s.getSymptomsJson() + " (" + s.getSeverity() + ")")
            .collect(Collectors.toList());

        // Recent mood
        List<MoodLog> moods = moodRepository.findByUserIdOrderByLogDateDesc(user.getId());
        String recentMood = moods.isEmpty() ? null : moods.get(0).getMoodsJson();

        // Hydration today
        LocalDate today = LocalDate.now();
        WaterLog waterLog = waterRepository.findByUserIdAndLogDate(user.getId(), today).orElse(null);
        int glasses = waterLog != null && waterLog.getGlassesConsumed() != null ? waterLog.getGlassesConsumed() : 0;
        int goal = user.getWaterGoalGlasses() != null ? user.getWaterGoalGlasses() : 8;
        String hydrationSummary = glasses + " of " + goal + " glasses logged today";

        return new AnonymizedUserCycleContext(
            prediction.getCyclePhase(),
            prediction.getCurrentCycleDay(),
            prediction.getDaysUntilNextPeriod(),
            prediction.getNextPeriodDate() != null ? prediction.getNextPeriodDate().toString() : "Unknown",
            prediction.getOvulationDate() != null ? prediction.getOvulationDate().toString() : "Unknown",
            (prediction.getFertileWindowStart() != null && prediction.getFertileWindowEnd() != null)
                ? prediction.getFertileWindowStart() + " to " + prediction.getFertileWindowEnd()
                : "Unknown",
            prediction.isIrregular(),
            user.getCycleLengthDays() != null ? user.getCycleLengthDays() : 28,
            user.getPeriodLengthDays() != null ? user.getPeriodLengthDays() : 5,
            user.getLastPeriodStart() != null ? user.getLastPeriodStart().toString() : null,
            recentSymptoms,
            recentMood,
            hydrationSummary
        );
    }
}
