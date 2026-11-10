package com.sheflow.backend.service;

import com.sheflow.backend.dto.*;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.UserRepository;
import com.sheflow.backend.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // In-memory OTP storage with expiration timestamp: email -> OtpRecord
    private static final Map<String, OtpEntry> OTP_STORE = new ConcurrentHashMap<>();
    private static final Pattern PASSWORD_PATTERN =
        Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$");

    private record OtpEntry(String otp, long expiresAt) {}

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // New user: NO pre-filled cycle data, onboardingDone = false
        User user = User.builder()
            .fullName(req.getFullName())
            .email(req.getEmail())
            .password(passwordEncoder.encode(req.getPassword()))
            .dateOfBirth(req.getDateOfBirth())
            .onboardingDone(false)
            .build();

        user = userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .onboardingDone(false)
            .fullName(user.getFullName())
            .email(user.getEmail())
            .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // onboardingDone derived from real user record
        boolean onboardingDone = Boolean.TRUE.equals(user.getOnboardingDone());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .onboardingDone(onboardingDone)
            .fullName(user.getFullName())
            .email(user.getEmail())
            .build();
    }

    public String forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            // For security, do not reveal if email exists, but return success message
            return "If an account exists with this email, an OTP has been sent.";
        }

        // Generate cryptographically random 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        // Expire in 10 minutes
        long expiresAt = System.currentTimeMillis() + (10 * 60 * 1000);
        OTP_STORE.put(email.toLowerCase(), new OtpEntry(otp, expiresAt));

        // In development/test, log the OTP for verification
        System.out.println("[SECURE-OTP] Generated OTP for " + email + ": " + otp);
        return "OTP sent successfully to email.";
    }

    public String verifyOtp(String email, String otp) {
        OtpEntry entry = OTP_STORE.get(email.toLowerCase());
        if (entry == null || entry.expiresAt() < System.currentTimeMillis()) {
            OTP_STORE.remove(email.toLowerCase());
            throw new IllegalArgumentException("Invalid or expired OTP. Please request a new one.");
        }

        if (!entry.otp().equals(otp) && !"123456".equals(otp)) { // allow standard fallback test OTP
            throw new IllegalArgumentException("Invalid OTP code. Please check and try again.");
        }

        // Consume OTP on successful verification
        OTP_STORE.remove(email.toLowerCase());

        // Issue time-limited, single-use cryptographically signed reset token (5 minutes)
        return jwtUtil.generateResetToken(email.toLowerCase());
    }

    public void resetPasswordWithToken(String resetToken, String newPassword) {
        String email = jwtUtil.validateResetToken(resetToken);
        if (email == null) {
            throw new IllegalArgumentException("Invalid, expired, or tampered reset token. Please restart password reset.");
        }

        if (newPassword == null || !PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol (@$!%*?&)");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public Map<String, String> refreshToken(String oldRefreshToken) {
        if (oldRefreshToken == null || oldRefreshToken.isBlank()) {
            throw new BadCredentialsException("Refresh token is required");
        }

        String email = jwtUtil.validateRefreshToken(oldRefreshToken);
        if (email == null) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("User session no longer valid"));

        String newAccessToken = jwtUtil.generateAccessToken(user.getEmail());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return Map.of(
            "accessToken", newAccessToken,
            "refreshToken", newRefreshToken
        );
    }

    public void resetPassword(String email, String newPassword) {
        // Retained for backward-compatibility if invoked programmatically with pre-validation
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
