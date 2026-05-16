package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.model.error.LlmApiException;
import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class LlmRetryHandlerTest {

    private final LlmRetryHandler handler = new LlmRetryHandler(3, List.of(
        Duration.ofMillis(10), Duration.ofMillis(10), Duration.ofMillis(10)
    ));

    @Test
    void shouldSucceedOnFirstAttempt() {
        var result = handler.executeWithRetry(() -> "ok");
        assertEquals("ok", result);
    }

    @Test
    void shouldSucceedAfterRetries() {
        var attempts = new AtomicInteger(0);
        var result = handler.executeWithRetry(() -> {
            if (attempts.incrementAndGet() <= 2) {
                throw new LlmApiException("retryable error");
            }
            return "success after " + attempts.get() + " attempts";
        });
        assertEquals("success after 3 attempts", result);
    }

    @Test
    void shouldThrowAfterAllRetriesExhausted() {
        var ex = assertThrows(LlmApiException.class, () ->
            handler.executeWithRetry(() -> { throw new LlmApiException("persistent error"); })
        );
        assertTrue(ex.getMessage().contains("persistent error"));
    }

    @Test
    void runtimeException_shouldBeWrappedAndRejected() {
        var ex = assertThrows(LlmApiException.class, () ->
            handler.executeWithRetry(() -> { throw new RuntimeException("bad request"); })
        );
        assertTrue(ex.getMessage().contains("bad request"));
    }

    @Test
    void ioException_shouldBeWrappedAndRetried() {
        var attempts = new AtomicInteger(0);
        var result = handler.executeWithRetry(() -> {
            if (attempts.incrementAndGet() <= 1) {
                throw new java.io.IOException("connection reset");
            }
            return "ok";
        });
        assertEquals("ok", result);
    }

    @Test
    void interruptException_shouldThrowImmediately() {
        assertThrows(Exception.class, () ->
            handler.executeWithRetry(() -> { throw new InterruptedException("interrupted"); })
        );
    }

    @Test
    void shouldHandleZeroRetries() {
        var noRetryHandler = new LlmRetryHandler(0, List.of());
        var result = noRetryHandler.executeWithRetry(() -> "ok");
        assertEquals("ok", result);
    }
}
