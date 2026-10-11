package com.example.ecommerce.rag;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "gemini")
public class GeminiClient implements LlmClient {

    private final RestClient http;
    private final String apiKey;
    private final String model;
    private final ObjectMapper mapper = new ObjectMapper();

    public GeminiClient(@Value("${app.ai.gemini-api-key:}") String apiKey,
                        @Value("${app.ai.gemini-model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(45_000);
        this.http = RestClient.builder().requestFactory(factory)
                .baseUrl("https://generativelanguage.googleapis.com").build();
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String complete(String system, List<Map<String, String>> messages, int maxTokens) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Map<String, String> m : messages) {
            String role = "assistant".equals(m.get("role")) ? "model" : "user";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", m.get("content")))));
        }

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", Math.max(maxTokens, 2048));

        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", system))),
                "contents", contents,
                "generationConfig", generationConfig);

        String raw = http.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode response;
        try {
            response = mapper.readTree(raw);
        } catch (Exception e) {
            String snippet = raw == null ? "null" : raw.substring(0, Math.min(raw.length(), 300));
            throw new IllegalStateException("Gemini returned a reply that is not JSON: " + snippet, e);
        }

        StringBuilder text = new StringBuilder();


        JsonNode parts = response == null ? null : response.path("candidates").path(0).path("content").path("parts");
        if (parts != null && parts.isArray()) {
            for (JsonNode part : parts) text.append(part.path("text").asText(""));
        }
        if (text.length() == 0) throw new IllegalStateException("Empty response from Gemini");
        return text.toString().trim();
    }
}