package com.example.ecommerce;

import org.junit.jupiter.api.Test;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

// Verifies the Spring application context starts (H2 in-memory database, dev profile).
// The AI keys are fake and the vector store is a mock, so this test needs no OpenAI / Pinecone account.
@SpringBootTest(properties = {
        "spring.ai.openai.api-key=test-key",
        "spring.ai.vectorstore.pinecone.api-key=test-key",
        "app.ai.index-on-startup=false"
})
@ActiveProfiles("dev")
class EcommerceApplicationTests {

    @MockitoBean
    VectorStore vectorStore;

    @Test
    void contextLoads() {
    }
}
