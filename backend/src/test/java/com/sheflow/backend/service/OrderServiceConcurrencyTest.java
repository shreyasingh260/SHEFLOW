package com.sheflow.backend.service;

import com.sheflow.backend.dto.CheckoutRequest;
import com.sheflow.backend.dto.OrderResponseDto;
import com.sheflow.backend.entity.Cart;
import com.sheflow.backend.entity.CartItem;
import com.sheflow.backend.entity.Product;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderServiceConcurrencyTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Product testProduct;
    private final List<User> testUsers = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // Clean previous test data
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();

        // Create a hot product with exactly 5 items in stock
        testProduct = productRepository.save(Product.builder()
            .name("Limited Edition Menstrual Cup")
            .brand("Sirona")
            .category("MENSTRUAL_CUPS")
            .price(new BigDecimal("299.00"))
            .stock(5) // Only 5 available in stock
            .rating(4.9)
            .build());

        // Prepare 10 distinct test users with 1 item each in their cart
        testUsers.clear();
        for (int i = 1; i <= 10; i++) {
            String email = "concurrency_user_" + i + "_" + System.currentTimeMillis() + "@test.com";
            User user = userRepository.save(User.builder()
                .fullName("Buyer " + i)
                .email(email)
                .password("$2a$10$e8wFvMh9wWpZ29z/2K287.s3J4.s81Yj0ySg6Mv42M2K1R9D7U5c6")
                .onboardingDone(true)
                .build());
            testUsers.add(user);

            Cart cart = cartRepository.save(Cart.builder().user(user).build());
            CartItem item = CartItem.builder()
                .cart(cart)
                .product(testProduct)
                .quantity(1)
                .unitPrice(testProduct.getPrice())
                .build();
            cartItemRepository.save(item);
            cart.setItems(new ArrayList<>(Collections.singletonList(item)));
            cartRepository.save(cart);
        }
    }

    @Test
    @DisplayName("Verify Zero Overselling: 10 concurrent buyers competing for 5 items results in exactly 5 orders and 0 negative stock")
    void testConcurrentCheckoutOversellingPrevention() throws InterruptedException {
        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threads);

        AtomicInteger successfulOrders = new AtomicInteger(0);
        AtomicInteger rejectedOrders = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all threads to fire at the exact same millisecond
                    User user = testUsers.get(index);
                    CheckoutRequest req = new CheckoutRequest();
                    req.setIdempotencyKey("idemp_concurrent_" + user.getId() + "_" + System.currentTimeMillis());
                    req.setShippingAddress("Test Address " + index);
                    req.setContactPhone("9876543210");

                    OrderResponseDto response = orderService.checkout(user.getEmail(), req);
                    if (response != null && response.getId() != null) {
                        successfulOrders.incrementAndGet();
                    }
                } catch (IllegalStateException e) {
                    // Expected when stock is exhausted
                    if (e.getMessage() != null && e.getMessage().contains("Insufficient inventory")) {
                        rejectedOrders.incrementAndGet();
                    }
                } catch (Exception e) {
                    System.err.println("Unexpected exception in thread: " + e.getMessage());
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Unleash all 10 threads simultaneously
        startLatch.countDown();
        boolean completed = finishLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "All concurrent checkout threads should complete within 30 seconds");

        // Reload the product from database to check final stock
        Product finalProduct = productRepository.findById(testProduct.getId()).orElseThrow();

        System.out.println("=== CONCURRENCY TEST AUDIT METRICS ===");
        System.out.println("Successful orders: " + successfulOrders.get());
        System.out.println("Rejected orders (insufficient stock): " + rejectedOrders.get());
        System.out.println("Final product stock in MySQL: " + finalProduct.getStock());

        // STRICT CONCURRENCY INVARIANTS:
        // 1. Exactly 5 purchases must succeed
        assertEquals(5, successfulOrders.get(), "Exactly 5 purchases should succeed for 5 available stock items");

        // 2. Exactly 5 purchases must be rejected
        assertEquals(5, rejectedOrders.get(), "Exactly 5 purchases should fail cleanly with Insufficient inventory");

        // 3. Final stock must be strictly 0 (NEVER negative!)
        assertEquals(0, finalProduct.getStock(), "Stock must be exactly 0, zero overselling permitted");
    }

    @Test
    @DisplayName("Verify Idempotency: Repeating checkout with the same idempotency key returns existing order without duplicate charging or stock decrement")
    void testCheckoutIdempotency() {
        User user = testUsers.get(0);
        String idempotencyKey = "unique_key_" + System.currentTimeMillis();

        CheckoutRequest req = new CheckoutRequest();
        req.setIdempotencyKey(idempotencyKey);
        req.setShippingAddress("Connaught Place, New Delhi");
        req.setContactPhone("9876543210");

        // First attempt
        OrderResponseDto firstAttempt = orderService.checkout(user.getEmail(), req);
        assertNotNull(firstAttempt);
        assertNotNull(firstAttempt.getOrderNumber());

        // Replay attempt with exact same idempotency key
        OrderResponseDto secondAttempt = orderService.checkout(user.getEmail(), req);
        assertNotNull(secondAttempt);

        // Must return identical order number and total without creating a second record
        assertEquals(firstAttempt.getOrderNumber(), secondAttempt.getOrderNumber(), "Replay must return identical order number");
        assertEquals(firstAttempt.getId(), secondAttempt.getId(), "Replay must return identical database ID");
    }
}
