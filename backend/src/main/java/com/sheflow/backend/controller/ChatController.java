package com.sheflow.backend.controller;

import com.sheflow.backend.dto.ApiResponse;
import com.sheflow.backend.dto.ChatMessageDto;
import com.sheflow.backend.service.FloraChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final FloraChatService floraChatService;

    public ChatController(FloraChatService floraChatService) {
        this.floraChatService = floraChatService;
    }

    private String getAuthenticatedEmail(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new BadCredentialsException("Unauthenticated: missing or invalid credentials");
        }
        return auth.getName();
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageDto>> getHistory(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        return ResponseEntity.ok(floraChatService.getChatHistory(email));
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, ChatMessageDto>> sendMessage(Authentication auth, @RequestBody Map<String, String> body) {
        String email = getAuthenticatedEmail(auth);
        String content = body.getOrDefault("content", "");
        return ResponseEntity.ok(floraChatService.processMessage(email, content));
    }

    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse> clearHistory(Authentication auth) {
        String email = getAuthenticatedEmail(auth);
        floraChatService.clearChatHistory(email);
        return ResponseEntity.ok(new ApiResponse("Chat history cleared successfully"));
    }
}
