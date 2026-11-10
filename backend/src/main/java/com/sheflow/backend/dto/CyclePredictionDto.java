package com.sheflow.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CyclePredictionDto {
    private LocalDate nextPeriodDate;
    private LocalDate ovulationDate;
    private LocalDate fertileWindowStart;
    private LocalDate fertileWindowEnd;
    private Integer predictedCycleLength;
    private Integer currentCycleDay;
    private Integer daysUntilNextPeriod;
    private String cyclePhase;

    @JsonProperty("isIrregular")
    private boolean isIrregular;
}
