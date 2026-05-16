package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.DatabaseConfig;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.model.schema.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.*;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchemaLoaderTest {

    @Mock
    private ConnectionPoolManager poolManager;

    @Test
    void loadSchema_shouldBuildDatabaseSchema() throws SQLException {
        var config = new DatabaseConfig(List.of(), Duration.ofSeconds(3), 500);
        var loader = new SchemaLoader(poolManager, config);

        // Mock withConnection for tables
        when(poolManager.withConnection(eq("testdb"), any()))
            .thenAnswer(invocation -> {
                var action = invocation.getArgument(1, com.sqlserver.mcp.datasource.SqlFunction.class);
                var conn = mock(Connection.class);
                var stmt = mock(PreparedStatement.class);
                var rs = mock(ResultSet.class);
                when(conn.prepareStatement(anyString())).thenReturn(stmt);
                when(stmt.executeQuery()).thenReturn(rs);
                when(rs.next()).thenReturn(false);
                return action.apply(conn);
            });

        var schema = loader.loadSchema("testdb");
        assertNotNull(schema);
        assertEquals("testdb", schema.databaseName());
    }
}
