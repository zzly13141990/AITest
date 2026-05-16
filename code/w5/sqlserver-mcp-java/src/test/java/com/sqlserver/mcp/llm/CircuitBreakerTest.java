package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.model.error.LlmApiException;
import org.junit.jupiter.api.Test;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

class CircuitBreakerTest {

    @Test
    void defaultConstructor_shouldUseDefaults() {
        var cb = new CircuitBreaker();
        assertDoesNotThrow(() -> cb.executeSupplier(() -> "ok"));
    }

    @Test
    void closedState_shouldAllowCalls() {
        var cb = new CircuitBreaker(10, 0.5, 30_000_000_000L, 3);
        var result = cb.executeSupplier(() -> "success");
        assertEquals("success", result);
    }

    @Test
    void shouldTransitionToOpenAfterFailures() {
        // Very low threshold: 1 call, 50% failure rate → opens immediately
        var cb = new CircuitBreaker(1, 0.5, 10_000_000_000L, 3);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail"); }));
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> "should be rejected"));
    }

    @Test
    void openState_shouldRejectCalls() {
        var cb = new CircuitBreaker(1, 0.5, 999_999_999_999L, 3);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail"); }));
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> "rejected"));
    }

    @Test
    void halfOpenState_shouldAllowLimitedCallsAfterWait() throws Exception {
        var cb = new CircuitBreaker(1, 0.5, 1L, 3);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail"); }));
        Thread.sleep(5);
        var result = cb.executeSupplier(() -> "recovered");
        assertEquals("recovered", result);
    }

    @Test
    void halfOpenSuccess_shouldTransitionToClosed() throws Exception {
        var cb = new CircuitBreaker(1, 0.5, 1L, 3);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail"); }));
        Thread.sleep(5);
        cb.executeSupplier(() -> "ok");
        var result = cb.executeSupplier(() -> "closed again");
        assertEquals("closed again", result);
    }

    @Test
    void halfOpenFailure_shouldTransitionBackToOpen() throws Exception {
        var cb = new CircuitBreaker(1, 0.5, 1L, 3);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail"); }));
        Thread.sleep(5);
        assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new LlmApiException("fail again"); }));
        // After half-open failure, circuit should be back to OPEN state
        assertEquals(CircuitBreaker.State.OPEN, cb.getState());
    }

    @Test
    void nonLlmException_shouldBeWrapped() {
        var cb = new CircuitBreaker(1, 0.5, 999_999_999_999L, 3);
        var ex = assertThrows(LlmApiException.class, () -> cb.executeSupplier(() -> { throw new RuntimeException("unexpected"); }));
        assertTrue(ex.getMessage().contains("unexpected"));
    }

    @Test
    void success_shouldNotCountInFailureRate() {
        var cb = new CircuitBreaker(5, 0.5, 999_999_999_999L, 3);
        assertDoesNotThrow(() -> cb.executeSupplier(() -> "ok"));
        assertDoesNotThrow(() -> cb.executeSupplier(() -> "ok"));
        assertDoesNotThrow(() -> cb.executeSupplier(() -> "ok"));
        assertDoesNotThrow(() -> cb.executeSupplier(() -> "ok"));
    }
}
