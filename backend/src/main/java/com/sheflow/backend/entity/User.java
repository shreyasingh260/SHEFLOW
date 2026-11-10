package com.sheflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "cycle_length_days")
    @Builder.Default
    private Integer cycleLengthDays = 28;

    @Column(name = "period_length_days")
    @Builder.Default
    private Integer periodLengthDays = 5;

    @Column(name = "last_period_start")
    private LocalDate lastPeriodStart;

    @Column(length = 20)
    @Builder.Default
    private String regularity = "REGULAR";

    @Column(name = "on_birth_control")
    @Builder.Default
    private Boolean onBirthControl = false;

    @Column(name = "water_goal_glasses")
    @Builder.Default
    private Integer waterGoalGlasses = 8;

    @Column(name = "weight_kg")
    @Builder.Default
    private Double weightKg = 55.0;

    @Column(name = "height_cm")
    @Builder.Default
    private Double heightCm = 162.0;

    @Column(name = "daily_protein_grams")
    @Builder.Default
    private Integer dailyProteinGrams = 60;

    @Column(name = "emergency_contacts", columnDefinition = "TEXT")
    private String emergencyContacts;

    @Column(name = "onboarding_done")
    @Builder.Default
    private Boolean onboardingDone = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
