package com.sheflow.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sheflow.backend.dto.LoginRequest;
import com.sheflow.backend.dto.SignupRequest;
import com.sheflow.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Verify user registration with compliant password succeeds")
    void testSignupSuccess() throws Exception {
        String email = "authtest_" + System.currentTimeMillis() + "@sheflow.com";
        SignupRequest req = new SignupRequest();
        req.setFullName("Aarti Sharma");
        req.setEmail(email);
        req.setPassword("Secure@Pass123");
        req.setConfirmPassword("Secure@Pass123");
        req.setDateOfBirth(LocalDate.of(1998, 4, 15));

        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.onboardingDone").value(false))
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("Verify duplicate registration with same email is rejected with 400 Bad Request")
    void testDuplicateSignupRejected() throws Exception {
        String email = "dup_" + System.currentTimeMillis() + "@sheflow.com";
        SignupRequest req = new SignupRequest();
        req.setFullName("First Registration");
        req.setEmail(email);
        req.setPassword("Secure@Pass123");
        req.setConfirmPassword("Secure@Pass123");

        // First registration
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());

        // Duplicate registration attempt
        mockMvc.perform(post("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("An account with this email already exists."));
    }

    @Test
    @DisplayName("Verify login with incorrect password returns 401 Unauthorized")
    void testLoginBadCredentials() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("nonexistent_" + System.currentTimeMillis() + "@sheflow.com");
        req.setPassword("WrongPass@123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Verify password reset without OTP or token is rejected")
    void testPasswordResetWithoutTokenRejected() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "victim@sheflow.com",
                    "newPassword", "HackedPass@123"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
    }
}
