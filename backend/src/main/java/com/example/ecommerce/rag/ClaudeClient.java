package com.example.ecommerce.rag;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;


@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "anthropic", matchIfMissing = true)
public class ClaudeClient implements LlmClient {

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public ClaudeClient(@Value("${app.ai.anthropic-api-key:}") String apiKey,
                        @Value("${app.ai.model:claude-haiku-5-5}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(45_000);
        this.http = RestClient.builder().requestFactory(factory).baseUrl("https://api.anthropic.com").build();
    }
    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }


    /** @param messages alternating {"role": "user"|"assistant", "content": "..."} starting with "user" */
    @Override
    public String complete(String system, List<Map<String, String>> messages, int maxTokens) {
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "system", system,
                "messages", messages);

        JsonNode response = http.post()
                .uri("/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        StringBuilder text = new StringBuilder();
        JsonNode content = response == null ? null : response.get("content");
        if (content != null) {
            for (JsonNode block : content) {
                if ("text".equals(block.path("type").asText())) text.append(block.path("text").asText());
            }
        }
        if (text.length() == 0) throw new IllegalStateException("Empty response from the language model");
        return text.toString().trim();
    }
}
