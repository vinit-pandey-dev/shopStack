package com.example.ecommerce.rag;

import org.springframework.ai.document.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Chunking for the store-policies markdown file: one chunk per "## Heading" section.
 * Each chunk becomes a Spring AI Document with a fixed id (policy-1, policy-2, ...), so indexing
 * the same file again overwrites the old vectors instead of adding duplicates.
 */
public final class PolicyChunker {

    public static final String ID_PREFIX = "policy-";

    private PolicyChunker() {}

    public static List<Document> split(String markdown) {
        List<Document> chunks = new ArrayList<>();
        if (markdown == null) return chunks;

        String title = null;
        StringBuilder body = new StringBuilder();
        int count = 0;

        for (String line : markdown.split("\\R")) {
            if (line.startsWith("## ")) {
                count = flush(chunks, title, body, count);
                title = line.substring(3).trim();
                body.setLength(0);
            } else if (title != null) {
                body.append(line).append('\n');
            }
        }
        flush(chunks, title, body, count);
        return chunks;
    }

    private static int flush(List<Document> out, String title, StringBuilder body, int count) {
        String text = body.toString().trim();
        if (title == null || text.isEmpty()) return count;

        // the heading is part of the text, so a short chunk still says what it is about
        Document chunk = Document.builder()
                .id(ID_PREFIX + (count + 1))
                .text(title + ": " + text)
                .metadata("type", "POLICY")
                .metadata("title", title)
                .build();
        out.add(chunk);
        return count + 1;
    }
}
