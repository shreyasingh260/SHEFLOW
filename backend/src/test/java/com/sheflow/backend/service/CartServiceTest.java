package com.sheflow.backend.service;

import com.sheflow.backend.dto.CartResponseDto;
import com.sheflow.backend.entity.Product;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.CartItemRepository;
import com.sheflow.backend.repository.CartRepository;
import com.sheflow.backend.repository.ProductRepository;
import com.sheflow.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CartServiceTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();

        String email = "cart_test_" + System.currentTimeMillis() + "@sheflow.com";
        testUser = userRepository.save(User.builder()
            .fullName("Cart Tester")
            .email(email)
            .password("DummyPass123!")
            .onboardingDone(true)
            .build());

        testProduct = productRepository.save(Product.builder()
            .name("Nua Organic Pads Pack")
            .brand("Nua")
            .category("PADS")
            .price(new BigDecimal("289.00"))
            .stock(50)
            .rating(5.0)
            .build());
    }

    @Test
    @DisplayName("Verify adding item to cart calculates correct subtotal and delivery fee")
    void testAddToCartAndCalculateTotals() {
        CartResponseDto cart = cartService.addToCart(testUser.getEmail(), testProduct.getId(), 2);

        assertNotNull(cart);
        assertEquals(2, cart.getTotalItems());
        assertEquals(new BigDecimal("578.00"), cart.getSubtotal()); // 289 * 2 = 578.00
        // > 499 => free delivery (0.00)
        assertEquals(BigDecimal.ZERO, cart.getDeliveryFee());
        assertEquals(new BigDecimal("578.00"), cart.getGrandTotal());
        assertEquals(1, cart.getItems().size());
        assertEquals("Nua Organic Pads Pack", cart.getItems().get(0).getProductName());
    }

    @Test
    @DisplayName("Verify delivery fee applies for orders under 499 INR")
    void testDeliveryFeeUnder499() {
        CartResponseDto cart = cartService.addToCart(testUser.getEmail(), testProduct.getId(), 1);

        assertEquals(1, cart.getTotalItems());
        assertEquals(new BigDecimal("289.00"), cart.getSubtotal());
        // Under 499 => ₹49 delivery fee
        assertEquals(new BigDecimal("49.00"), cart.getDeliveryFee());
        assertEquals(new BigDecimal("338.00"), cart.getGrandTotal());
    }

    @Test
    @DisplayName("Verify rejection when requested quantity exceeds available stock")
    void testAddToCartExcessQuantityRejected() {
        assertThrows(IllegalArgumentException.class, () -> {
            cartService.addToCart(testUser.getEmail(), testProduct.getId(), 100); // stock is 50
        });
    }

    @Test
    @DisplayName("Verify clearing cart removes all items")
    void testClearCart() {
        cartService.addToCart(testUser.getEmail(), testProduct.getId(), 2);
        cartService.clearCart(testUser.getEmail());

        CartResponseDto emptyCart = cartService.getCart(testUser.getEmail());
        assertEquals(0, emptyCart.getTotalItems());
        assertEquals(BigDecimal.ZERO, emptyCart.getSubtotal());
        assertTrue(emptyCart.getItems().isEmpty());
    }
}
