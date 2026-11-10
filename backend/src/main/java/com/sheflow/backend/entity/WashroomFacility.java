package com.sheflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "washroom_facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WashroomFacility {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "facility_type", nullable = false, length = 50)
    private String facilityType; // VENDING_MACHINE, PUBLIC_TOILET, CAFE

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "wheelchair_accessible")
    @Builder.Default
    private Boolean wheelchairAccessible = false;

    @Column(name = "opening_hours")
    @Builder.Default
    private String openingHours = "24 hrs";

    @Column(name = "rating")
    @Builder.Default
    private Double rating = 4.7;

    @Column(name = "has_sanitary_pads")
    @Builder.Default
    private Boolean hasSanitaryPads = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
