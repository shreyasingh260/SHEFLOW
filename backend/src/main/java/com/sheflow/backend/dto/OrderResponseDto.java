package com.sheflow.backend.dto;

import com.sheflow.backend.entity.Order;
import com.sheflow.backend.entity.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponseDto {
    private Long id;
    private String orderNumber;
    private String idempotencyKey;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String contactPhone;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;

    public static OrderResponseDto fromEntity(Order order) {
        if (order == null) return null;
        List<OrderItemDto> itemsList = order.getItems() != null
            ? order.getItems().stream().map(OrderItemDto::fromEntity).toList()
            : List.of();

        return OrderResponseDto.builder()
            .id(order.getId())
            .orderNumber(order.getOrderNumber())
            .idempotencyKey(order.getIdempotencyKey())
            .status(order.getStatus())
            .totalAmount(order.getTotalAmount())
            .shippingAddress(order.getShippingAddress())
            .contactPhone(order.getContactPhone())
            .createdAt(order.getCreatedAt())
            .items(itemsList)
            .build();
    }
}
