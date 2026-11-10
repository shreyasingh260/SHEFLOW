package com.sheflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "products",
    indexes = {
        @Index(name = "idx_products_cat_rating", columnList = "category, rating"),
        @Index(name = "idx_products_name", columnList = "name"),
        @Index(name = "idx_products_brand", columnList = "brand")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    @Builder.Default
    private String brand = "Nua";

    @Column(nullable = false, length = 50)
    private String category; // PADS, TAMPONS, MENSTRUAL_CUPS, PAIN_RELIEF

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = new BigDecimal("289.00");

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 100;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "rating")
    @Builder.Default
    private Double rating = 4.8;

    @Column(name = "platforms_json", columnDefinition = "JSON")
    private String platformsJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
