package com.example.ecommerce.rag;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatRateLimiterTest {

    @Test
    void blocksAfterTheLimitAndCountsEachUserSeparately() {
        ChatRateLimiter limiter = new ChatRateLimiter(2);

        assertTrue(limiter.allow("john"));
        assertTrue(limiter.allow("john"));
        assertFalse(limiter.allow("john"));   // 3rd question in the same minute
        assertTrue(limiter.allow("mary"));    // another user is not affected
    }
}
