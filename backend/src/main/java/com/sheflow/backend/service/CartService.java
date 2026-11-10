package com.sheflow.backend.service;

import com.sheflow.backend.dto.CartItemDto;
import com.sheflow.backend.dto.CartResponseDto;
import com.sheflow.backend.entity.Cart;
import com.sheflow.backend.entity.CartItem;
import com.sheflow.backend.entity.Product;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.CartItemRepository;
import com.sheflow.backend.repository.CartRepository;
import com.sheflow.backend.repository.ProductRepository;
import com.sheflow.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(
        CartRepository cartRepository,
        CartItemRepository cartItemRepository,
        ProductRepository productRepository,
        UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Cart getOrCreateCartEntity(User user) {
        return cartRepository.findByUserId(user.getId())
            .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @Transactional(readOnly = true)
    public CartResponseDto getCart(String email) {
        User user = getUser(email);
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
            .orElseGet(() -> getOrCreateCartEntity(user));

        return toDto(cart);
    }

    @Transactional
    public CartResponseDto addToCart(String email, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        User user = getUser(email);
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        if (product.getStock() != null && product.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient inventory. Available: " + product.getStock());
        }

        Cart cart = getOrCreateCartEntity(user);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
            .orElse(null);

        if (item != null) {
            int newQty = item.getQuantity() + quantity;
            if (product.getStock() != null && product.getStock() < newQty) {
                throw new IllegalArgumentException("Cannot add more. Max available stock is " + product.getStock());
            }
            item.setQuantity(newQty);
            item.setUnitPrice(product.getPrice()); // ensure live unit price
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getPrice())
                .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return toDto(cartRepository.findByUserIdWithItems(user.getId()).orElse(cart));
    }

    @Transactional
    public CartResponseDto updateQuantity(String email, Long itemId, int quantity) {
        User user = getUser(email);
        Cart cart = getOrCreateCartEntity(user);

        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Unauthorized access to cart item");
        }

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            if (item.getProduct().getStock() != null && item.getProduct().getStock() < quantity) {
                throw new IllegalArgumentException("Only " + item.getProduct().getStock() + " units available in stock");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return toDto(cartRepository.findByUserIdWithItems(user.getId()).orElse(cart));
    }

    @Transactional
    public CartResponseDto removeItem(String email, Long itemId) {
        return updateQuantity(email, itemId, 0);
    }

    @Transactional
    public void clearCart(String email) {
        User user = getUser(email);
        cartRepository.findByUserId(user.getId()).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    private CartResponseDto toDto(Cart cart) {
        BigDecimal subtotal = cart.calculateSubtotal();
        // Free delivery on orders above ₹499, otherwise ₹49 flat
        BigDecimal deliveryFee = subtotal.compareTo(new BigDecimal("499.00")) >= 0 || subtotal.compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : new BigDecimal("49.00");
        BigDecimal grandTotal = subtotal.add(deliveryFee);

        List<CartItemDto> items = cart.getItems() != null
            ? cart.getItems().stream().map(CartItemDto::fromEntity).toList()
            : List.of();

        return CartResponseDto.builder()
            .cartId(cart.getId())
            .totalItems(cart.calculateTotalItems())
            .subtotal(subtotal)
            .deliveryFee(deliveryFee)
            .grandTotal(grandTotal)
            .items(items)
            .build();
    }
}
