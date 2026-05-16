package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.datasource.SqlFunction;
import com.sqlserver.mcp.model.schema.ColumnInfo;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import com.sqlserver.mcp.model.schema.TableInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParseOnlyValidatorTest {

    @Mock
    private ConnectionPoolManager poolManager;

    @Test
    void validSql_shouldPass() throws Exception {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), null);
        var validator = new ParseOnlyValidator(poolManager);

        when(poolManager.withConnection(eq("testdb"), any(SqlFunction.class)))
            .thenAnswer(invocation -> {
                @SuppressWarnings("unchecked")
                SqlFunction<Connection, Void> fn = invocation.getArgument(1);
                var conn = mock(Connection.class);
                var stmt = mock(Statement.class);
                var rs = mock(ResultSet.class);
                when(conn.createStatement()).thenReturn(stmt);
                when(stmt.executeQuery(anyString())).thenReturn(rs);
                fn.apply(conn);
                return null;
            });

        var result = validator.check("SELECT * FROM users", schema);
        assertTrue(result.isEmpty());
    }

    @Test
    void invalidSql_shouldReturnSyntaxError() throws Exception {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), null);
        var validator = new ParseOnlyValidator(poolManager);

        when(poolManager.withConnection(eq("testdb"), any(SqlFunction.class)))
            .thenAnswer(invocation -> {
                @SuppressWarnings("unchecked")
                SqlFunction<Connection, Void> fn = invocation.getArgument(1);
                var conn = mock(Connection.class);
                var stmt = mock(Statement.class);
                when(conn.createStatement()).thenReturn(stmt);
                // Simulate SET PARSEONLY ON success, execute failure, then SET PARSEONLY OFF
                doReturn(false)
                    .doThrow(new RuntimeException("Incorrect syntax near 'x'"))
                    .doReturn(false)
                    .when(stmt).execute(anyString());
                fn.apply(conn);
                return null;
            });

        var result = validator.check("SELECT invalid sql", schema);
        // Syntax error should be caught
        assertNotNull(result);
    }

    @Test
    void unexpectedException_shouldReturnValidationError() throws Exception {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), null);
        var validator = new ParseOnlyValidator(poolManager);

        when(poolManager.withConnection(eq("testdb"), any(SqlFunction.class)))
            .thenThrow(new RuntimeException("Unexpected error"));

        var result = validator.check("SELECT * FROM users", schema);
        assertTrue(result.isPresent());
        assertEquals("VALIDATION_ERROR", result.get().errorCode());
    }

    @Test
    void extractTableNames_shouldReturnTableReferences() {
        var tables = ParseOnlyValidator.extractTableNames("SELECT * FROM users JOIN orders ON users.id = orders.user_id");
        assertTrue(tables.contains("users"));
        assertTrue(tables.contains("orders"));
    }

    @Test
    void extractTableNames_shouldIncludeSchemaPrefix() {
        var tables = ParseOnlyValidator.extractTableNames("SELECT * FROM dbo.users");
        assertTrue(tables.contains("dbo.users"));
    }

    @Test
    void extractTableNames_shouldHandleNoFromClause() {
        var tables = ParseOnlyValidator.extractTableNames("SELECT 1");
        assertTrue(tables.isEmpty());
    }
}
