package com.example.ecommerce.rag;


public record KnowledgeChunk(String id, String type, Long productId, String title, String text) {}
