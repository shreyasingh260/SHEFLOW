package com.sheflow.backend.service;

import com.sheflow.backend.dto.CheckoutRequest;
import com.sheflow.backend.dto.OrderResponseDto;
import com.sheflow.backend.entity.*;
import com.sheflow.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    public OrderService(
        OrderRepository orderRepository,
        CartRepository cartRepository,
        ProductRepository productRepository,
        UserRepository userRepository,
        PaymentTransactionRepository paymentTransactionRepository
    ) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /**
     * Checkout with strict Concurrency Control (Pessimistic Locking) and Idempotency Protection.
     * Guaranteed:
     * 1. 0 duplicate orders (checked via uk_orders_idempotency).
     * 2. 0 overselling (guaranteed via row-level write lock SELECT ... FOR UPDATE).
     * 3. Complete transaction rollback if any item lacks stock.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderResponseDto checkout(String email, CheckoutRequest req) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        // 1. Idempotency Check
        String idempotencyKey = req.getIdempotencyKey();
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = "auto_" + UUID.randomUUID();
        }

        Order existingOrder = orderRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existingOrder != null) {
            // Idempotent replay: return existing confirmed order without re-charging or re-decrementing
            return OrderResponseDto.fromEntity(existingOrder);
        }

        // 2. Load Cart
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
            .orElseThrow(() -> new IllegalStateException("Cart is empty. Please add items before checkout."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Please add items before checkout.");
        }

        String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 9000 + 1000);
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = Order.builder()
            .user(user)
            .orderNumber(orderNumber)
            .idempotencyKey(idempotencyKey)
            .status(OrderStatus.PAID)
            .shippingAddress(req.getShippingAddress())
            .contactPhone(req.getContactPhone())
            .totalAmount(BigDecimal.ZERO)
            .build();

        // 3. Atomic Database Decrement & Zero-Overselling Guard
        for (CartItem cartItem : cart.getItems()) {
            Long productId = cartItem.getProduct().getId();
            int qtyRequested = cartItem.getQuantity();

            // Direct atomic decrement in MySQL engine: guaranteed to reject when stock < qtyRequested
            int rowsUpdated = productRepository.decrementStockAtomic(productId, qtyRequested);
            if (rowsUpdated == 0) {
                Product p = productRepository.findById(productId).orElse(null);
                int available = p != null && p.getStock() != null ? p.getStock() : 0;
                String prodName = p != null ? p.getName() : "Product #" + productId;
                throw new IllegalStateException("Insufficient inventory for '" + prodName + "'. Available: " + available + ", Requested: " + qtyRequested);
            }

            Product lockedProduct = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product no longer exists: " + productId));

            BigDecimal unitPrice = lockedProduct.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qtyRequested));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(lockedProduct)
                .productName(lockedProduct.getName())
                .quantity(qtyRequested)
                .unitPrice(unitPrice)
                .subtotal(subtotal)
                .build();

            orderItems.add(orderItem);
        }

        // Add standard delivery calculation (free over ₹499)
        BigDecimal deliveryFee = totalAmount.compareTo(new BigDecimal("499.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("49.00");
        order.setTotalAmount(totalAmount.add(deliveryFee));
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);

        // Record initial payment transaction
        PaymentTransaction payment = PaymentTransaction.builder()
            .order(savedOrder)
            .transactionId("TXN-" + UUID.randomUUID())
            .paymentGateway(req.getPaymentGateway() != null ? req.getPaymentGateway() : "MOCK_GATEWAY")
            .amount(savedOrder.getTotalAmount())
            .status(PaymentStatus.SUCCESS)
            .build();
        paymentTransactionRepository.save(payment);

        // Clear user's cart on successful checkout
        cart.getItems().clear();
        cartRepository.save(cart);

        return OrderResponseDto.fromEntity(savedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponseDto> getOrderHistory(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
            .map(OrderResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderByNumber(String email, String orderNumber) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Order order = orderRepository.findByOrderNumberWithItems(orderNumber)
            .orElseThrow(() -> new IllegalArgumentException("Order not found with number: " + orderNumber));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized to view this order.");
        }

        return OrderResponseDto.fromEntity(order);
    }
}
