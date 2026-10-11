package com.example.ecommerce.rag;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class VectorIndex {

    private final List<KnowledgeChunk> chunks;
    private final float[][] vectors;
    private final QueryEmbedder queryEmbedder;
    private final String mode;

    public VectorIndex(List<KnowledgeChunk> chunks, float[][] vectors, QueryEmbedder queryEmbedder, String mode) {
        if (chunks.size() != vectors.length) throw new IllegalArgumentException("chunks/vectors size mismatch");
        this.chunks = List.copyOf(chunks);
        this.vectors = vectors;
        this.queryEmbedder = queryEmbedder;
        this.mode = mode;
    }

    public String mode() { return mode; }

    public int size() { return chunks.size(); }

    /** Cosine-similarity search. Returns at most k chunks scoring at least minScore, best first. */
    public List<ScoredChunk> search(String query, int k, double minScore) {
        if (chunks.isEmpty() || query == null || query.isBlank()) return List.of();

        float[] q = VectorMath.normalize(queryEmbedder.embed(query));
        List<ScoredChunk> scored = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            scored.add(new ScoredChunk(chunks.get(i), VectorMath.dot(q, vectors[i])));
        }
        scored.sort(Comparator.comparingDouble(ScoredChunk::score).reversed());

        List<ScoredChunk> top = new ArrayList<>();
        for (ScoredChunk s : scored) {
            if (top.size() >= k || s.score() < minScore) break;
            top.add(s);
        }
        return top;
    }
}
