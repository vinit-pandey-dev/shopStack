package com.example.ecommerce.rag;

import java.util.List;
import java.util.Map;

public interface LlmClient {
    boolean isConfigured();
    String complete(String system, List<Map<String, String>> messages, int maxTokens);
}