package com.sheflow.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private boolean onboardingDone;
    private String fullName;
    private String email;
}
