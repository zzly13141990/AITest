package com.sqlserver.mcp.observability;

import com.sqlserver.mcp.config.AppConfig.ObservabilityConfig;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.exporter.logging.LoggingSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class OpenTelemetryConfig {
    private static final Logger log = LoggerFactory.getLogger(OpenTelemetryConfig.class);

    private OpenTelemetryConfig() {}

    public static OpenTelemetry create(ObservabilityConfig config) {
        if (!config.tracingEnabled()) {
            log.info("OpenTelemetry tracing is disabled, returning noop instance");
            return OpenTelemetry.noop();
        }

        try {
            var resource = Resource.getDefault().toBuilder()
                    .put("service.name", "sqlserver-mcp")
                    .put("service.version", "1.0.0")
                    .build();

            var sdkTracerProvider = SdkTracerProvider.builder()
                .setResource(resource)
                .addSpanProcessor(SimpleSpanProcessor.create(LoggingSpanExporter.create()))
                .build();

            var openTelemetry = OpenTelemetrySdk.builder()
                .setTracerProvider(sdkTracerProvider)
                .build();

            log.info("OpenTelemetry initialized with logging exporter");
            return openTelemetry;
        } catch (Exception e) {
            log.warn("Failed to initialize OpenTelemetry, falling back to noop: {}", e.getMessage());
            return OpenTelemetry.noop();
        }
    }
}
