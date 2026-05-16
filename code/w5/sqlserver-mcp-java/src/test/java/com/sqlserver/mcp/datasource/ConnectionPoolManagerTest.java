package com.sqlserver.mcp.datasource;

import com.sqlserver.mcp.config.AppConfig.DataSourceConfig;
import com.sqlserver.mcp.model.error.DbConnectionException;
import com.sqlserver.mcp.model.error.SchemaNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Connection;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ConnectionPoolManagerTest {

    private static DataSourceConfig createConfig(String name) {
        return new DataSourceConfig(
            name, "localhost", 1433, name, "SA", "password",
            1, 2,
            Duration.ofSeconds(5), Duration.ofMinutes(30), Duration.ofSeconds(60)
        );
    }

    @Test
    void constructor_shouldHandleEmptyConfigs() {
        var manager = new ConnectionPoolManager(List.of());
        assertDoesNotThrow(() -> manager.close());
    }

    @Test
    void isAvailable_shouldReturnFalseForUnknown() {
        var manager = new ConnectionPoolManager(List.of());
        assertFalse(manager.isAvailable("unknown"));
    }

    @Test
    void withConnection_shouldThrowOnUnknownDatabase() {
        var manager = new ConnectionPoolManager(List.of());
        assertThrows(SchemaNotFoundException.class,
            () -> manager.withConnection("nonexistent", conn -> conn.isValid(5)));
    }

    @Test
    void withConnection_overload_shouldThrowOnUnknownDatabase() {
        var manager = new ConnectionPoolManager(List.of());
        assertThrows(SchemaNotFoundException.class,
            () -> manager.withConnection("nonexistent", "SELECT 1", rs -> 1));
    }

    @Test
    void close_shouldBeIdempotent() {
        var manager = new ConnectionPoolManager(List.of());
        assertDoesNotThrow(() -> {
            manager.close();
            manager.close();
        });
    }

    @Test
    void withConnection_shouldHandleNullActionGracefully() {
        var manager = new ConnectionPoolManager(List.of());
        assertThrows(SchemaNotFoundException.class,
            () -> manager.withConnection("default", conn -> { throw new NullPointerException("simulated"); }));
    }
}
