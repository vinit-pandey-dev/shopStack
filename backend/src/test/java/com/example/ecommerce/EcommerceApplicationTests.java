package com.example.ecommerce;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class EcommerceApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring application context starts successfully
        // using the H2 in-memory database (dev profile).
    }
}
