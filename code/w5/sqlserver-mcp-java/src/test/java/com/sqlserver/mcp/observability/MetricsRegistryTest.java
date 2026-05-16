package com.sqlserver.mcp.observability;

import com.sqlserver.mcp.config.AppConfig.ObservabilityConfig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MetricsRegistryTest {

    @Test
    void incrementQueryCount_shouldWork() {
        var config = new ObservabilityConfig(true, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertDoesNotThrow(() -> registry.incrementQueryCount("testdb", "execute", "success"));
    }

    @Test
    void disabledMetrics_shouldNotThrow() {
        var config = new ObservabilityConfig(false, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertDoesNotThrow(() -> {
            registry.incrementQueryCount("testdb", "execute", "success");
            registry.recordQueryDuration("testdb", "execute", 100);
            registry.recordLlmDuration("generate", 200);
            registry.incrementValidationResult("L1", "pass");
        });
    }

    @Test
    void recordQueryDuration_shouldWork() {
        var config = new ObservabilityConfig(true, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertDoesNotThrow(() -> registry.recordQueryDuration("testdb", "execute", 150));
    }

    @Test
    void recordLlmDuration_shouldWork() {
        var config = new ObservabilityConfig(true, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertDoesNotThrow(() -> registry.recordLlmDuration("generateSql", 500));
    }

    @Test
    void incrementValidationResult_shouldWork() {
        var config = new ObservabilityConfig(true, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertDoesNotThrow(() -> registry.incrementValidationResult("L1", "pass"));
    }

    @Test
    void getMeterRegistry_shouldReturnRegistry() {
        var config = new ObservabilityConfig(true, false, false, "", "INFO", "./logs");
        var registry = new MetricsRegistry(config);
        assertNotNull(registry.getMeterRegistry());
    }
}
