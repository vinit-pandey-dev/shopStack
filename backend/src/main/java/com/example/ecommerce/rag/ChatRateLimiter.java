package com.example.ecommerce.rag;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Every question costs money (embedding + LLM call), so one user can only ask N questions per minute.
 * Sliding one-minute window, kept in memory: fine for one server (use Redis if you run several).
 */
@Component
public class ChatRateLimiter {

    private static final long WINDOW_MS = 60_000;
    private static final int MAX_USERS = 10_000;

    private final int maxPerMinute;
    private final Map<String, Deque<Long>> recentCalls = new ConcurrentHashMap<>();

    public ChatRateLimiter(@Value("${app.ai.rate-limit-per-minute:10}") int maxPerMinute) {
        this.maxPerMinute = maxPerMinute;
    }

    /** @return true if this user may ask now (and records the call), false if the limit is reached */
    public boolean allow(String username) {
        long now = System.currentTimeMillis();

        // the map must not grow forever, so start fresh if it ever gets huge
        if (recentCalls.size() > MAX_USERS) {
            recentCalls.clear();
        }
        Deque<Long> calls = recentCalls.computeIfAbsent(username, k -> new ArrayDeque<>());
        synchronized (calls) {
            while (!calls.isEmpty() && now - calls.peekFirst() > WINDOW_MS) {
                calls.pollFirst();
            }
            if (calls.size() >= maxPerMinute) {
                return false;
            }
            calls.addLast(now);
            return true;
        }
    }
}
