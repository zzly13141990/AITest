package com.sqlserver.mcp.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;

public class YamlConfigLoader {
    private static final Logger log = LoggerFactory.getLogger(YamlConfigLoader.class);
    private static final ObjectMapper YAML_MAPPER = new ObjectMapper(new YAMLFactory())
        .registerModule(new JavaTimeModule())
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private final String configPath;

    public YamlConfigLoader(String configPath) {
        this.configPath = configPath;
    }

    public AppConfig load() {
        var yamlConfig = loadYamlOrDefault();
        return new AppConfig(
            mapMcpConfig(yamlConfig),
            mapDatabaseConfig(yamlConfig),
            mapLlmConfig(yamlConfig),
            mapQueryConfig(yamlConfig),
            mapObservabilityConfig(yamlConfig)
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> loadYamlOrDefault() {
        var path = configPath != null ? configPath : System.getenv("CONFIG_PATH");
        if (path == null) path = "./application.yml";

        var file = new File(path);
        if (!file.exists()) {
            log.warn("Config file not found at {}, using defaults", path);
            return Map.of();
        }

        try (InputStream is = new FileInputStream(file)) {
            return YAML_MAPPER.readValue(is, Map.class);
        } catch (Exception e) {
            log.warn("Failed to load config file {}, using defaults: {}", path, e.getMessage());
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private com.sqlserver.mcp.config.AppConfig.McpConfig mapMcpConfig(Map<String, Object> root) {
        var mcp = getMap(root, "mcp");
        return new com.sqlserver.mcp.config.AppConfig.McpConfig(
            str(mcp, "server-name", "sqlserver-mcp"),
            str(mcp, "server-version", "1.0.0"),
            str(mcp, "transport", "stdio")
        );
    }

    @SuppressWarnings("unchecked")
    private AppConfig.DatabaseConfig mapDatabaseConfig(Map<String, Object> root) {
        var db = getMap(root, "database");
        var sourcesRaw = getList(db, "sources");
        var sources = sourcesRaw.stream()
            .map(raw -> (Map<String, Object>) raw)
            .map(this::mapDataSourceConfig)
            .toList();
        return new AppConfig.DatabaseConfig(
            sources,
            duration(db, "schema-load-timeout", Duration.ofSeconds(3)),
            intVal(db, "schema-cache-max-tables", 500)
        );
    }

    @SuppressWarnings("unchecked")
    private AppConfig.DataSourceConfig mapDataSourceConfig(Map<String, Object> src) {
        var name = str(src, "name", "default");
        var envPassword = System.getenv("DB_" + name.toUpperCase() + "_PASSWORD");
        var yamlPassword = str(src, "password", "");
        if (yamlPassword != null && !yamlPassword.isBlank() && envPassword == null) {
            log.warn("DataSource '{}' password is in YAML, should use env var DB_{}_PASSWORD", name, name.toUpperCase());
            envPassword = yamlPassword;
        }

        return new AppConfig.DataSourceConfig(
            name,
            str(src, "host", "localhost"),
            intVal(src, "port", 1433),
            str(src, "database", name),
            str(src, "username", "SA"),
            envPassword != null ? envPassword : "",
            intVal(src, "min-pool-size", 2),
            intVal(src, "max-pool-size", 10),
            duration(src, "connection-timeout", Duration.ofSeconds(5)),
            duration(src, "max-lifetime", Duration.ofMinutes(30)),
            duration(src, "leak-detection-threshold", Duration.ofSeconds(60))
        );
    }

    @SuppressWarnings("unchecked")
    private AppConfig.LlmConfig mapLlmConfig(Map<String, Object> root) {
        var llm = getMap(root, "llm");
        var apiKey = System.getenv("LLM_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            var yamlKey = str(llm, "api-key", "");
            if (!yamlKey.isBlank()) {
                log.warn("LLM API key is in YAML, should use env var LLM_API_KEY");
                apiKey = yamlKey;
            }
        }
        var delaysRaw = getList(llm, "retry-delays");
        var delays = delaysRaw.isEmpty()
            ? List.of(Duration.ofSeconds(1), Duration.ofSeconds(3), Duration.ofSeconds(9))
            : delaysRaw.stream().map(d -> parseDuration(String.valueOf(d))).toList();

        return new AppConfig.LlmConfig(
            str(llm, "api-base-url", "https://api.deepseek.com/v1"),
            str(llm, "model", "deepseek-v4-flash"),
            apiKey != null ? apiKey : "",
            doubleVal(llm, "temperature", 0.1),
            intVal(llm, "max-tokens", 2000),
            duration(llm, "timeout", Duration.ofSeconds(30)),
            intVal(llm, "max-retries", 3),
            delays
        );
    }

    @SuppressWarnings("unchecked")
    private AppConfig.QueryConfig mapQueryConfig(Map<String, Object> root) {
        var q = getMap(root, "query");
        var features = getMap(q, "features");
        return new AppConfig.QueryConfig(
            intVal(q, "default-page-size", 100),
            intVal(q, "max-page-size", 10000),
            intVal(q, "max-rows-total", 100000),
            intVal(q, "max-result-bytes", 52_428_800),
            new AppConfig.QueryConfig.Features(
                boolVal(features, "result-meaning-validation", true)
            )
        );
    }

    @SuppressWarnings("unchecked")
    private AppConfig.ObservabilityConfig mapObservabilityConfig(Map<String, Object> root) {
        var obs = getMap(root, "observability");
        var metrics = getMap(obs, "metrics");
        var tracing = getMap(obs, "tracing");
        var logging = getMap(obs, "logging");
        return new AppConfig.ObservabilityConfig(
            boolVal(metrics, "enabled", true),
            boolVal(metrics, "jmx-enabled", false),
            boolVal(tracing, "enabled", false),
            str(tracing, "endpoint", ""),
            str(logging, "level", "INFO"),
            str(logging, "audit-log-path", "./logs/audit")
        );
    }

    // --- Helper methods ---

    @SuppressWarnings("unchecked")
    private static Map<String, Object> getMap(Map<String, Object> parent, String key) {
        if (parent == null) return Map.of();
        var val = parent.get(key);
        if (val instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> getList(Map<String, Object> parent, String key) {
        if (parent == null) return List.of();
        var val = parent.get(key);
        if (val instanceof List<?> l) return (List<Object>) l;
        return List.of();
    }

    private static String str(Map<String, Object> map, String key, String def) {
        if (map == null) return def;
        var val = map.get(key);
        return val != null ? val.toString() : def;
    }

    private static int intVal(Map<String, Object> map, String key, int def) {
        if (map == null) return def;
        var val = map.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) try { return Integer.parseInt(s); } catch (NumberFormatException e) { return def; }
        return def;
    }

    private static double doubleVal(Map<String, Object> map, String key, double def) {
        if (map == null) return def;
        var val = map.get(key);
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) try { return Double.parseDouble(s); } catch (NumberFormatException e) { return def; }
        return def;
    }

    private static boolean boolVal(Map<String, Object> map, String key, boolean def) {
        if (map == null) return def;
        var val = map.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        return def;
    }

    private static Duration duration(Map<String, Object> map, String key, Duration def) {
        if (map == null) return def;
        var val = map.get(key);
        if (val instanceof Duration d) return d;
        if (val instanceof String s) return parseDuration(s);
        return def;
    }

    private static Duration parseDuration(String s) {
        if (s == null || s.isBlank()) return Duration.ofSeconds(30);
        try {
            if (s.endsWith("ms")) return Duration.ofMillis(Long.parseLong(s.replace("ms", "").trim()));
            if (s.endsWith("s")) return Duration.ofSeconds(Long.parseLong(s.replace("s", "").trim()));
            if (s.endsWith("m")) return Duration.ofMinutes(Long.parseLong(s.replace("m", "").trim()));
            if (s.endsWith("h")) return Duration.ofHours(Long.parseLong(s.replace("h", "").trim()));
            return Duration.ofSeconds(Long.parseLong(s));
        } catch (NumberFormatException e) {
            return Duration.ofSeconds(30);
        }
    }
}
