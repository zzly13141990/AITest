package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.DatabaseConfig;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

public class SchemaCache implements SchemaProvider {
    private static final Logger log = LoggerFactory.getLogger(SchemaCache.class);

    private final SchemaLoader loader;
    private final DatabaseConfig config;
    private final ConcurrentHashMap<String, DatabaseSchema> cache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<DatabaseSchema>> pendingLoads = new ConcurrentHashMap<>();

    public SchemaCache(SchemaLoader loader, DatabaseConfig config) {
        this.loader = loader;
        this.config = config;
    }

    public void initialize(List<String> databaseNames) {
        log.info("Pre-loading schema for {} databases: {}", databaseNames.size(), databaseNames);
        for (var name : databaseNames) {
            var future = CompletableFuture.supplyAsync(() -> {
                var schema = loader.loadSchema(name);
                cache.put(name, schema);
                pendingLoads.remove(name);
                log.info("Schema cached for database '{}': {} tables, {} views",
                    name, schema.tables().size(), schema.views().size());
                return schema;
            }).exceptionally(ex -> {
                log.error("Failed to pre-load schema for database '{}': {}", name, ex.getMessage());
                pendingLoads.remove(name);
                return null;
            });
            pendingLoads.put(name, future);
        }
    }

    @Override
    public DatabaseSchema getSchema(String databaseName) {
        var cached = cache.get(databaseName);
        if (cached != null) return cached;

        // Single-flight pattern: only one thread loads at a time per database
        var future = pendingLoads.computeIfAbsent(databaseName, key -> {
            log.info("Schema miss for database '{}', loading asynchronously", key);
            return CompletableFuture.supplyAsync(() -> {
                var schema = loader.loadSchema(key);
                cache.put(key, schema);
                pendingLoads.remove(key);
                return schema;
            }).exceptionally(ex -> {
                log.error("Failed to load schema for database '{}': {}", key, ex.getMessage());
                pendingLoads.remove(key);
                return null;
            });
        });

        try {
            var schema = future.join();
            if (schema == null) {
                throw new RuntimeException("Failed to load schema for database '" + databaseName + "'");
            }
            return schema;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load schema for database '" + databaseName + "'", e);
        }
    }

    public void refresh(String databaseName) {
        cache.remove(databaseName);
        pendingLoads.remove(databaseName);
        log.info("Schema cache cleared for database '{}'", databaseName);
        getSchema(databaseName); // trigger reload
    }
}
