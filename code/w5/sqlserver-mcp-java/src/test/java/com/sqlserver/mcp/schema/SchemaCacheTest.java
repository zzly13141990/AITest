package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.DatabaseConfig;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchemaCacheTest {

    @Mock
    private SchemaLoader loader;

    private DatabaseConfig config() {
        return mock(DatabaseConfig.class);
    }

    @Test
    void getSchema_shouldThrow_whenSchemaNotLoaded() {
        var cache = new SchemaCache(loader, config());
        assertThrows(RuntimeException.class, () -> cache.getSchema("unknown"));
    }

    @Test
    void getSchema_shouldReturnCachedSchema() {
        var schema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), Instant.now());
        when(loader.loadSchema("test")).thenReturn(schema);

        var cache = new SchemaCache(loader, config());
        cache.initialize(List.of("test"));

        // Give the async initialization time to complete
        awaitCache(cache, "test");

        // Second call should use cache
        var result = cache.getSchema("test");
        assertNotNull(result);
        assertEquals("test", result.databaseName());
    }

    @Test
    void initialize_shouldHandleEmptyNames() {
        var cache = new SchemaCache(loader, config());
        assertDoesNotThrow(() -> cache.initialize(List.of()));
    }

    @Test
    void refresh_shouldClearCache() {
        var schema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), Instant.now());
        when(loader.loadSchema("test")).thenReturn(schema);

        var cache = new SchemaCache(loader, config());
        cache.initialize(List.of("test"));

        // Verify initialize triggers loadSchema
        verify(loader, timeout(5000).atLeastOnce()).loadSchema("test");

        cache.refresh("test");
        // refresh calls getSchema which should trigger another load
        verify(loader, timeout(5000).atLeast(2)).loadSchema("test");
    }

    @Test
    void getSchema_shouldReturn_whenAlreadyCached() {
        var schema = new DatabaseSchema("preloaded", Map.of(), Map.of(), List.of(), Instant.now());
        when(loader.loadSchema("preloaded")).thenReturn(schema);

        var cache = new SchemaCache(loader, config());
        cache.initialize(List.of("preloaded"));

        var result = cache.getSchema("preloaded");
        assertNotNull(result);
    }

    private static void awaitCache(SchemaCache cache, String dbName) {
        var deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline) {
            try {
                var schema = cache.getSchema(dbName);
                if (schema != null) return;
            } catch (Exception e) {
                // not loaded yet
            }
            Thread.yield();
        }
    }
}
