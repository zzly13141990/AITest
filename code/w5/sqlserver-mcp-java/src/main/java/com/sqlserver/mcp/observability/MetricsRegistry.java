package com.sqlserver.mcp.observability;

import com.sqlserver.mcp.config.AppConfig.ObservabilityConfig;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

public class MetricsRegistry {
    private static final Logger log = LoggerFactory.getLogger(MetricsRegistry.class);

    private final MeterRegistry meterRegistry;
    private final boolean enabled;

    private final ConcurrentHashMap<String, Counter> queryCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Counter> validationCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Timer> queryTimers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Timer> llmTimers = new ConcurrentHashMap<>();

    public MetricsRegistry(ObservabilityConfig config) {
        this.enabled = config.metricsEnabled();
        this.meterRegistry = enabled ? new SimpleMeterRegistry() : new SimpleMeterRegistry();
        if (enabled) {
            log.info("Metrics registry initialized");
        }
    }

    public void incrementQueryCount(String database, String mode, String status) {
        if (!enabled) return;
        var key = database + "." + mode + "." + status;
        var counter = queryCounters.computeIfAbsent(key, k ->
            Counter.builder("sqlserver.query.count")
                .tag("database", database)
                .tag("mode", mode)
                .tag("status", status)
                .register(meterRegistry)
        );
        counter.increment();
    }

    public void recordQueryDuration(String database, String mode, long durationMs) {
        if (!enabled) return;
        var key = database + "." + mode;
        var timer = queryTimers.computeIfAbsent(key, k ->
            Timer.builder("sqlserver.query.duration")
                .tag("database", database)
                .tag("mode", mode)
                .register(meterRegistry)
        );
        timer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordLlmDuration(String operation, long durationMs) {
        if (!enabled) return;
        var key = operation;
        var timer = llmTimers.computeIfAbsent(key, k ->
            Timer.builder("sqlserver.llm.duration")
                .tag("operation", operation)
                .register(meterRegistry)
        );
        timer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void incrementValidationResult(String layer, String result) {
        if (!enabled) return;
        var key = layer + "." + result;
        var counter = validationCounters.computeIfAbsent(key, k ->
            Counter.builder("sqlserver.validation.result")
                .tag("layer", layer)
                .tag("result", result)
                .register(meterRegistry)
        );
        counter.increment();
    }

    public MeterRegistry getMeterRegistry() {
        return meterRegistry;
    }
}
