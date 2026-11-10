package com.sheflow.backend.dto;

import com.sheflow.backend.entity.CartItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemDto {
    private Long itemId;
    private Long productId;
    private String productName;
    private String productBrand;
    private String productImage;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;

    public static CartItemDto fromEntity(CartItem item) {
        if (item == null) return null;
        return CartItemDto.builder()
            .itemId(item.getId())
            .productId(item.getProduct().getId())
            .productName(item.getProduct().getName())
            .productBrand(item.getProduct().getBrand())
            .productImage(item.getProduct().getImageUrl())
            .unitPrice(item.getUnitPrice())
            .quantity(item.getQuantity())
            .subtotal(item.getSubtotal())
            .build();
    }
}
