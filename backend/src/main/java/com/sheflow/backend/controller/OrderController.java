package com.sheflow.backend.controller;

import com.sheflow.backend.dto.CheckoutRequest;
import com.sheflow.backend.dto.OrderResponseDto;
import com.sheflow.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new BadCredentialsException("Authentication required to manage orders");
        }
        return auth.getName();
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponseDto> checkout(
        Authentication auth,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyHeader,
        @Valid @RequestBody CheckoutRequest req
    ) {
        String email = getAuthenticatedEmail(auth);
        if (idempotencyHeader != null && !idempotencyHeader.isBlank()) {
            req.setIdempotencyKey(idempotencyHeader.trim());
        }
        return ResponseEntity.ok(orderService.checkout(email, req));
    }

    @GetMapping
    public ResponseEntity<Page<OrderResponseDto>> getOrderHistory(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        String email = getAuthenticatedEmail(auth);
        int clampedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orderService.getOrderHistory(email, pageable));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponseDto> getOrderDetails(
        Authentication auth,
        @PathVariable String orderNumber
    ) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(orderService.getOrderByNumber(email, orderNumber));
    }
}
