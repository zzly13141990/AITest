package com.sqlserver.mcp.pipeline;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StageMetricsTest {

    @Test
    void shouldCreateRecord() {
        var metrics = new StageMetrics("validation", 150, true);
        assertEquals("validation", metrics.stageName());
        assertEquals(150, metrics.durationMs());
        assertTrue(metrics.success());
    }

    @Test
    void shouldHandleFailedMetrics() {
        var metrics = new StageMetrics("llm", 5000, false);
        assertEquals("llm", metrics.stageName());
        assertEquals(5000, metrics.durationMs());
        assertFalse(metrics.success());
    }
}
