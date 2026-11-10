package com.sheflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutRequest {

    /**
     * Unique client idempotency key. If omitted in body, must be passed in 'Idempotency-Key' HTTP header.
     */
    private String idempotencyKey;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @NotBlank(message = "Contact phone number is required")
    private String contactPhone;

    private String paymentGateway = "MOCK_GATEWAY";
}
