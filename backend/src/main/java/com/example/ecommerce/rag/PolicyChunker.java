package com.example.ecommerce.rag;

import java.util.ArrayList;
import java.util.List;


public final class PolicyChunker {

    private PolicyChunker() {}

    public static List<KnowledgeChunk> split(String markdown) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        if (markdown == null) return chunks;

        String title = null;
        StringBuilder body = new StringBuilder();
        int n = 0;

        for (String line : markdown.split("\\R")) {
            if (line.startsWith("## ")) {
                n = flush(chunks, title, body, n);
                title = line.substring(3).trim();
                body.setLength(0);
            } else if (title != null) {
                body.append(line).append('\n');
            }
        }
        flush(chunks, title, body, n);
        return chunks;
    }

    private static int flush(List<KnowledgeChunk> out, String title, StringBuilder body, int n) {
        String text = body.toString().trim();
        if (title == null || text.isEmpty()) return n;
        out.add(new KnowledgeChunk("policy-" + (n + 1), "POLICY", null, title, title + ": " + text));
        return n + 1;
    }
}
