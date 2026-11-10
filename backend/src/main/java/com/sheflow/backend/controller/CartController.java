package com.sheflow.backend.controller;

import com.sheflow.backend.dto.AddToCartRequest;
import com.sheflow.backend.dto.ApiResponse;
import com.sheflow.backend.dto.CartResponseDto;
import com.sheflow.backend.dto.UpdateCartItemRequest;
import com.sheflow.backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new BadCredentialsException("Authentication required to access shopping cart");
        }
        return auth.getName();
    }

    @GetMapping
    public ResponseEntity<CartResponseDto> getCart(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(cartService.getCart(email));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponseDto> addItem(
        Authentication auth,
        @Valid @RequestBody AddToCartRequest req
    ) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(cartService.addToCart(email, req.getProductId(), req.getQuantity()));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDto> updateItem(
        Authentication auth,
        @PathVariable Long itemId,
        @Valid @RequestBody UpdateCartItemRequest req
    ) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(cartService.updateQuantity(email, itemId, req.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDto> removeItem(
        Authentication auth,
        @PathVariable Long itemId
    ) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(cartService.removeItem(email, itemId));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse> clearCart(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        cartService.clearCart(email);
        return ResponseEntity.ok(new ApiResponse("Cart cleared successfully"));
    }
}
