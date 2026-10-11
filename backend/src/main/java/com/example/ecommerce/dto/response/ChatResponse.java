package com.example.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChatResponse {

    private String answer;
    private List<Source> sources;

    
    @Data
    @AllArgsConstructor
    public static class Source {
        private String type;       
        private Long productId;    
        private String title;
    }
}
