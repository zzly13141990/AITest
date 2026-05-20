package com.sqlserver.mcp.config;

import java.time.Duration;
import java.util.List;

public record AppConfig(
    McpConfig mcp,
    DatabaseConfig database,
    LlmConfig llm,
    QueryConfig query,
    ObservabilityConfig observability
) {
    public static AppConfig defaults() {
        return new AppConfig(
            new McpConfig("sqlserver-mcp", "1.0.0", "sse", 8080),
            new DatabaseConfig(
                List.of(),
                Duration.ofSeconds(3),
                500
            ),
            new LlmConfig(
                "https://api.deepseek.com/v1",
                "deepseek-v4-flash",
                "",
                0.1,
                2000,
                Duration.ofSeconds(30),
                3,
                List.of(Duration.ofSeconds(1), Duration.ofSeconds(3), Duration.ofSeconds(9))
            ),
            new QueryConfig(100, 10000, 100000, 52_428_800, new QueryConfig.Features(true)),
            new ObservabilityConfig(true, false, false, "", "INFO", "./logs/audit")
        );
    }

    public record McpConfig(
        String serverName,
        String serverVersion,
        String transport,
        int port
    ) {
        public McpConfig {
            if (port == 0) port = 8080;
        }
    }

    public record DatabaseConfig(
        List<DataSourceConfig> sources,
        Duration schemaLoadTimeout,
        int schemaCacheMaxTables
    ) {}

    public record DataSourceConfig(
        String name,
        String host,
        int port,
        String database,
        String username,
        String password,
        int minPoolSize,
        int maxPoolSize,
        Duration connectionTimeout,
        Duration maxLifetime,
        Duration leakDetectionThreshold
    ) {
        public DataSourceConfig {
            if (port == 0) port = 1433;
            if (minPoolSize == 0) minPoolSize = 2;
            if (maxPoolSize == 0) maxPoolSize = 10;
            if (connectionTimeout == null) connectionTimeout = Duration.ofSeconds(5);
            if (maxLifetime == null) maxLifetime = Duration.ofMinutes(30);
            if (leakDetectionThreshold == null) leakDetectionThreshold = Duration.ofSeconds(60);
        }
    }

    public record LlmConfig(
        String apiBaseUrl,
        String model,
        String apiKey,
        double temperature,
        int maxTokens,
        Duration timeout,
        int maxRetries,
        List<Duration> retryDelays
    ) {
        public LlmConfig {
            if (apiBaseUrl == null || apiBaseUrl.isBlank()) apiBaseUrl = "https://api.deepseek.com/v1";
            if (model == null || model.isBlank()) model = "deepseek-v4-flash";
            if (temperature == 0) temperature = 0.1;
            if (maxTokens == 0) maxTokens = 2000;
            if (timeout == null) timeout = Duration.ofSeconds(30);
            if (maxRetries == 0) maxRetries = 3;
            if (retryDelays == null || retryDelays.isEmpty())
                retryDelays = List.of(Duration.ofSeconds(1), Duration.ofSeconds(3), Duration.ofSeconds(9));
        }
    }

    public record QueryConfig(
        int defaultPageSize,
        int maxPageSize,
        int maxRowsTotal,
        int maxResultBytes,
        Features features
    ) {
        public QueryConfig {
            if (defaultPageSize == 0) defaultPageSize = 100;
            if (maxPageSize == 0) maxPageSize = 10000;
            if (maxRowsTotal == 0) maxRowsTotal = 100000;
            if (maxResultBytes == 0) maxResultBytes = 52_428_800;
            if (features == null) features = new Features(true);
        }

        public record Features(boolean resultMeaningValidation) {}
    }

    public record ObservabilityConfig(
        boolean metricsEnabled,
        boolean jmxEnabled,
        boolean tracingEnabled,
        String tracingEndpoint,
        String loggingLevel,
        String auditLogPath
    ) {}
}
