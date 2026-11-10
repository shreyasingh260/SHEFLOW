package com.sheflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SignupRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
        message = "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol (@$!%*?&)"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private LocalDate dateOfBirth;
}
