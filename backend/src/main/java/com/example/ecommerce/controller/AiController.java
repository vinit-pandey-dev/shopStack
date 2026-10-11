package com.example.ecommerce.controller;

import com.example.ecommerce.dto.request.ChatRequest;
import com.example.ecommerce.dto.response.ChatResponse;
import com.example.ecommerce.rag.RagChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final RagChatService chatService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(Authentication auth, @Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.ask(auth.getName(), request));
    }
}
