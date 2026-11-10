package com.sheflow.backend.controller;

import com.sheflow.backend.dto.*;
import com.sheflow.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout() {
        return ResponseEntity.ok(new ApiResponse("Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String msg = authService.forgotPassword(email);
        return ResponseEntity.ok(new ApiResponse(msg));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String otp = body != null ? body.get("otp") : null;
        if (email == null || otp == null) {
            throw new IllegalArgumentException("Email and OTP are required");
        }
        String resetToken = authService.verifyOtp(email, otp);
        return ResponseEntity.ok(Map.of(
            "message", "OTP verified successfully",
            "resetToken", resetToken
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> body) {
        if (body == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        String resetToken = body.get("resetToken");
        String newPassword = body.get("newPassword");

        if (resetToken != null && !resetToken.isBlank()) {
            authService.resetPasswordWithToken(resetToken, newPassword);
        } else {
            // Backward-compatible fallback: verify OTP if passed directly
            String email = body.get("email");
            String otp = body.get("otp");
            if (otp == null || otp.isBlank()) {
                throw new IllegalArgumentException("A verified resetToken or valid OTP is strictly required to reset password.");
            }
            String token = authService.verifyOtp(email, otp);
            authService.resetPasswordWithToken(token, newPassword);
        }

        return ResponseEntity.ok(new ApiResponse("Password reset successfully. You can now log in with your new password."));
    }
}
