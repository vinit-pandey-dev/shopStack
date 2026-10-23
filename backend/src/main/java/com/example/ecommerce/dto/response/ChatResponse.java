package com.example.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChatResponse {

    private String answer;
    private List<Source> sources;

    /** What the answer was grounded in: a product (link target) or a policy section. */
    @Data
    @AllArgsConstructor
    public static class Source {
        private String type;       // PRODUCT | POLICY
        private Long productId;    // null for policies
        private String title;
    }
}
