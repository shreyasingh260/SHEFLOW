package com.sheflow.backend.dto;

import com.sheflow.backend.entity.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductResponseDto {
    private Long id;
    private String name;
    private String brand;
    private String category;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private boolean inStock;
    private Double rating;
    private String imageUrl;
    private String platformsJson;

    public static ProductResponseDto fromEntity(Product p) {
        if (p == null) return null;
        int stockVal = p.getStock() != null ? p.getStock() : 0;
        return ProductResponseDto.builder()
            .id(p.getId())
            .name(p.getName())
            .brand(p.getBrand())
            .category(p.getCategory())
            .description(p.getDescription())
            .price(p.getPrice())
            .stock(stockVal)
            .inStock(stockVal > 0)
            .rating(p.getRating())
            .imageUrl(p.getImageUrl())
            .platformsJson(p.getPlatformsJson())
            .build();
    }
}
