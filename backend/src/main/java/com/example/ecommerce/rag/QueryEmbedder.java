package com.example.ecommerce.rag;


@FunctionalInterface
public interface QueryEmbedder {
    float[] embed(String query);
}
