package com.sheflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private String message;
    private boolean success = true;

    public ApiResponse(String message) {
        this.message = message;
        this.success = true;
    }
}
