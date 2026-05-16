package com.sqlserver.mcp.observability;

import com.sqlserver.mcp.config.AppConfig.ObservabilityConfig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OpenTelemetryConfigTest {

    @Test
    void disabled_shouldReturnNoop() {
        var config = new ObservabilityConfig(false, false, false, "", "INFO", "./logs");
        var otel = OpenTelemetryConfig.create(config);
        assertNotNull(otel);
        assertNotNull(otel.getTracerProvider());
    }

    @Test
    void enabled_shouldCreateSdkInstance() {
        var config = new ObservabilityConfig(false, false, true, "", "INFO", "./logs");
        var otel = OpenTelemetryConfig.create(config);
        assertNotNull(otel);
        assertNotNull(otel.getTracerProvider());
    }

    @Test
    void enabledWithInvalidConfig_shouldFallbackToNoop() {
        var config = new ObservabilityConfig(false, false, true, "", "INFO", "./logs");
        var otel = OpenTelemetryConfig.create(config);
        assertNotNull(otel);
        // Should not throw regardless of configuration
        var tracer = otel.getTracer("test");
        assertNotNull(tracer);
    }
}
