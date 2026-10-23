package com.example.ecommerce.rag;

import com.example.ecommerce.entity.Product;
import com.example.ecommerce.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
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

/**
 * The ingestion side of RAG: load -> chunk -> embed -> store.
 *
 * Spring AI does the embedding and the storing: vectorStore.add(...) turns each Document into a vector
 * (EmbeddingModel) and saves it in Pinecone. Every document has a FIXED id, so adding it again is an upsert.
 *
 * Only static text is stored (name, category, description). Price and stock are NOT stored here,
 * they are read live from MySQL when a question is answered (see RagChatService).
 */
@Service
public class KnowledgeIndexService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeIndexService.class);

    static final String PRODUCT_ID_PREFIX = "product-";
    // if the policies file gets shorter, delete up to this many leftover chunks of the old version
    private static final int MAX_OLD_POLICY_CHUNKS = 20;

    private final VectorStore vectorStore;
    private final ProductRepository productRepository;

    @Value("${app.ai.index-on-startup:true}")
    private boolean indexOnStartup;

    public KnowledgeIndexService(VectorStore vectorStore, ProductRepository productRepository) {
        this.vectorStore = vectorStore;
        this.productRepository = productRepository;
    }

    /** Runs once after the app has started (and after DataSeeder has filled the database). */
    @EventListener(ApplicationReadyEvent.class)
    public void indexEverything() {
        if (!indexOnStartup) {
            log.info("Knowledge indexing at startup is switched off (app.ai.index-on-startup=false)");
            return;
        }
        try {
            List<Document> documents = new ArrayList<>();
            for (Product p : productRepository.findAllWithCategory()) {
                documents.add(toDocument(p));
            }
            List<Document> policies = PolicyChunker.split(readPolicies());
            documents.addAll(policies);

            deleteLeftoverPolicyChunks(policies.size());
            if (!documents.isEmpty()) {
                vectorStore.add(documents);
            }
            log.info("Indexed {} chunks ({} policy sections) into the vector store", documents.size(), policies.size());
        } catch (RuntimeException e) {
            // the shop must keep working even if OpenAI / Pinecone is down right now
            log.error("Could not index the knowledge base. The AI assistant may give no answers until the next start.", e);
        }
    }

    /** Called after an admin creates or edits a product: only that one vector is replaced. */
    public void indexProduct(Product product) {
        try {
            vectorStore.add(List.of(toDocument(product)));
        } catch (RuntimeException e) {
            log.warn("Could not update product {} in the vector store: {}", product.getId(), e.toString());
        }
    }

    /** Called after an admin deletes a product. */
    public void removeProduct(Long productId) {
        try {
            vectorStore.delete(List.of(PRODUCT_ID_PREFIX + productId));
        } catch (RuntimeException e) {
            log.warn("Could not remove product {} from the vector store: {}", productId, e.toString());
        }
    }

    private Document toDocument(Product p) {
        String category = p.getCategory() != null ? p.getCategory().getName() : "General";
        String description = p.getDescription() == null ? "" : p.getDescription();
        return Document.builder()
                .id(PRODUCT_ID_PREFIX + p.getId())
                .text(p.getName() + ". Category: " + category + ". " + description)
                .metadata("type", "PRODUCT")
                .metadata("productId", p.getId())
                .metadata("title", p.getName())
                .build();
    }

    private void deleteLeftoverPolicyChunks(int currentCount) {
        List<String> oldIds = new ArrayList<>();
        for (int i = currentCount + 1; i <= currentCount + MAX_OLD_POLICY_CHUNKS; i++) {
            oldIds.add(PolicyChunker.ID_PREFIX + i);
        }
        try {
            vectorStore.delete(oldIds);
        } catch (RuntimeException e) {
            log.warn("Could not delete old policy chunks: {}", e.toString());
        }
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
