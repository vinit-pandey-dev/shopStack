package com.example.ecommerce.rag;

import java.util.*;


public final class LocalTfIdfEmbedder {

    private static final Set<String> STOP = Set.of(
            "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "is", "are", "was", "be",
            "it", "its", "this", "that", "with", "by", "as", "from", "do", "does", "can", "i", "you", "we",
            "my", "me", "your", "our", "have", "has", "what", "which", "how", "any", "there", "if", "so",
            "about", "please", "want", "need", "show", "tell", "get", "give", "under", "than", "much");

    private final Map<String, Integer> vocab;
    private final double[] idf;

    private LocalTfIdfEmbedder(Map<String, Integer> vocab, double[] idf) {
        this.vocab = vocab;
        this.idf = idf;
    }

    public static LocalTfIdfEmbedder fit(List<String> documents) {
        Map<String, Integer> df = new HashMap<>();
        for (String doc : documents) {
            for (String term : new HashSet<>(tokenize(doc))) df.merge(term, 1, Integer::sum);
        }
        Map<String, Integer> vocab = new HashMap<>();
        double[] idf = new double[df.size()];
        int n = documents.size();
        int i = 0;
        for (Map.Entry<String, Integer> e : df.entrySet()) {
            vocab.put(e.getKey(), i);
            idf[i] = Math.log((1.0 + n) / (1.0 + e.getValue())) + 1.0;
            i++;
        }
        return new LocalTfIdfEmbedder(vocab, idf);
    }

    public float[] embed(String text) {
        float[] vec = new float[idf.length];
        for (String term : tokenize(text)) {
            Integer idx = vocab.get(term);
            if (idx != null) vec[idx] += (float) idf[idx];
        }
        return VectorMath.normalize(vec);
    }

    static List<String> tokenize(String text) {
        List<String> out = new ArrayList<>();
        if (text == null) return out;
        for (String raw : text.toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
            if (raw.length() < 2 || STOP.contains(raw)) continue;
            out.add(stem(raw));
        }
        return out;
    }

    /** Very light stemming: "watches"->"watch", "headphones"->"headphone", "batteries"->"battery". */
    private static String stem(String w) {
        if (w.length() > 4 && w.endsWith("ies")) return w.substring(0, w.length() - 3) + "y";
        if (w.length() > 4 && (w.endsWith("ches") || w.endsWith("shes") || w.endsWith("sses") || w.endsWith("xes")))
            return w.substring(0, w.length() - 2);
        if (w.length() > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.substring(0, w.length() - 1);
        return w;
    }
}
