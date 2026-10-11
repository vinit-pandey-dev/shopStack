package com.example.ecommerce.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ChatRequest {

    @NotBlank(message = "Please type a question")
    @Size(max = 500, message = "Questions can be at most 500 characters")
    private String message;

    @Valid
    @Size(max = 20, message = "Conversation history is too long")
    private List<Turn> history;

    @Data
    public static class Turn {
        private String role;      

        @Size(max = 2000, message = "A history message is too long")
        private String content;
    }
}
