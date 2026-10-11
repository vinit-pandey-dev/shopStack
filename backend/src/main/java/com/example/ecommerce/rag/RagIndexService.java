package com.example.ecommerce.rag;

import com.example.ecommerce.entity.Product;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Owns the vector index (the "R" in RAG).
 *
 *  - Built from the product catalog (database) + the store-policies markdown file.
 *  - Built once at startup, then lazily rebuilt on the next question after an admin
 *    creates / edits / deletes a product (see markDirty()).
 *  - Uses Voyage embeddings when VOYAGE_API_KEY is set, otherwise a local TF-IDF fallback.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RagIndexService {

    private final ProductRepository productRepository;
    private final VoyageEmbeddingClient voyage;

    @Value("${app.ai.top-k:4}")
    private int topK;

    @Value("${app.ai.min-score:0.01}")
    private double minScore;

    private final AtomicBoolean dirty = new AtomicBoolean(true);
    private volatile VectorIndex index;

    /** Call after the catalog changes. Cheap: the actual rebuild happens on the next question. */
    public void markDirty() {
        dirty.set(true);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void warmUp() {
        try {
            ensureFresh();
        } catch (Exception e) {
            log.warn("RAG index warm-up failed; it will be retried on the first question: {}", e.toString());
        }
    }

    public List<ScoredChunk> search(String query) {
        return ensureFresh().search(query, topK, minScore);
    }

    private synchronized VectorIndex ensureFresh() {
        if (index == null || dirty.get()) {
            dirty.set(false);   // clear first, so an edit that happens during the build is not lost
            try {
                index = build();
            } catch (RuntimeException e) {
                dirty.set(true);
                if (index == null) throw e;
                log.warn("RAG index rebuild failed, serving the previous index: {}", e.toString());
            }
        }
        return index;
    }

    private VectorIndex build() {
        List<KnowledgeChunk> chunks = new ArrayList<>();

        for (Product p : productRepository.findAllWithCategory()) {
            String category = p.getCategory() != null ? p.getCategory().getName() : "General";
            String description = p.getDescription() == null ? "" : p.getDescription();
            // Only STATIC facts are embedded. Price and stock are fetched live when answering.
            chunks.add(new KnowledgeChunk("product-" + p.getId(), "PRODUCT", p.getId(), p.getName(),
                    p.getName() + ". Category: " + category + ". " + description));
        }
        chunks.addAll(PolicyChunker.split(readPolicies()));

        if (chunks.isEmpty()) {
            return new VectorIndex(List.of(), new float[0][], q -> new float[0], "empty");
        }

        List<String> texts = chunks.stream().map(KnowledgeChunk::text).toList();

        if (voyage.isConfigured()) {
            try {
                float[][] vectors = voyage.embed(texts, "document").stream()
                        .map(VectorMath::normalize)
                        .toArray(float[][]::new);
                log.info("RAG index built: {} chunks, retrieval=voyage (semantic embeddings)", chunks.size());
                return new VectorIndex(chunks, vectors, q -> voyage.embed(List.of(q), "query").get(0), "voyage");
            } catch (RuntimeException e) {
                log.warn("Voyage embeddings failed, falling back to local TF-IDF retrieval: {}", e.toString());
            }
        }

        LocalTfIdfEmbedder local = LocalTfIdfEmbedder.fit(texts);
        float[][] vectors = new float[texts.size()][];
        for (int i = 0; i < vectors.length; i++) vectors[i] = local.embed(texts.get(i));
        log.info("RAG index built: {} chunks, retrieval=local TF-IDF (set VOYAGE_API_KEY for semantic search)", chunks.size());
        return new VectorIndex(chunks, vectors, local::embed, "local");
    }

    private String readPolicies() {
        try (InputStream in = new ClassPathResource("knowledge/store-policies.md").getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Could not read knowledge/store-policies.md: {}", e.toString());
            return "";
        }
    }
}
