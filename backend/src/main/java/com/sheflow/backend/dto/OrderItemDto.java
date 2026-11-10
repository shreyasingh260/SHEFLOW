package com.sheflow.backend.dto;

import com.sheflow.backend.entity.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    public static OrderItemDto fromEntity(OrderItem item) {
        if (item == null) return null;
        return OrderItemDto.builder()
            .id(item.getId())
            .productId(item.getProduct() != null ? item.getProduct().getId() : null)
            .productName(item.getProductName())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subtotal(item.getSubtotal())
            .build();
    }
}
