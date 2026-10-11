package com.example.ecommerce.rag;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Component
public class VoyageEmbeddingClient {

    private static final int BATCH_SIZE = 64;

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public VoyageEmbeddingClient(@Value("${app.ai.voyage-api-key:}") String apiKey,
                                 @Value("${app.ai.embedding-model:voyage-4-lite}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(30_000);
        this.http = RestClient.builder().requestFactory(factory).baseUrl("https://api.voyageai.com").build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** @param inputType "document" for stored chunks, "query" for the user's question */
    public List<float[]> embed(List<String> texts, String inputType) {
        List<float[]> result = new ArrayList<>(texts.size());
        for (int start = 0; start < texts.size(); start += BATCH_SIZE) {
            List<String> batch = texts.subList(start, Math.min(start + BATCH_SIZE, texts.size()));

            JsonNode response = http.post()
                    .uri("/v1/embeddings")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("input", batch, "model", model, "input_type", inputType))
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode data = response == null ? null : response.get("data");
            if (data == null || data.size() != batch.size()) {
                throw new IllegalStateException("Unexpected response from the embeddings API");
            }
            for (JsonNode item : data) {
                JsonNode e = item.get("embedding");
                float[] vector = new float[e.size()];
                for (int i = 0; i < vector.length; i++) vector[i] = (float) e.get(i).asDouble();
                result.add(vector);
            }
        }
        return result;
    }
}
