package com.example.ecommerce.rag;

import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PolicyChunkerTest {

    private static final String MD = """
            # Title that is ignored

            ## Shipping
            Free shipping on every order.

            ## Payments
            Card, UPI and cash on delivery.

            ## Empty section
            """;

    @Test
    void oneChunkPerHeadingWithFixedIds() {
        List<Document> chunks = PolicyChunker.split(MD);

        assertEquals(2, chunks.size());                       // the empty section is skipped
        assertEquals("policy-1", chunks.get(0).getId());
        assertEquals("policy-2", chunks.get(1).getId());
        assertEquals("POLICY", chunks.get(0).getMetadata().get("type"));
        assertTrue(chunks.get(0).getText().startsWith("Shipping: "));
    }

    @Test
    void nullOrEmptyInputGivesNoChunks() {
        assertTrue(PolicyChunker.split(null).isEmpty());
        assertTrue(PolicyChunker.split("no headings here").isEmpty());
    }
}
