package com.sheflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cycle_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CyclePrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "predicted_cycle_length", nullable = false)
    private Integer predictedCycleLength;

    @Column(name = "next_period_date", nullable = false)
    private LocalDate nextPeriodDate;

    @Column(name = "ovulation_date", nullable = false)
    private LocalDate ovulationDate;

    @Column(name = "fertile_window_start", nullable = false)
    private LocalDate fertileWindowStart;

    @Column(name = "fertile_window_end", nullable = false)
    private LocalDate fertileWindowEnd;

    @Column(name = "is_irregular")
    @Builder.Default
    private Boolean isIrregular = false;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        this.calculatedAt = LocalDateTime.now();
    }
}
