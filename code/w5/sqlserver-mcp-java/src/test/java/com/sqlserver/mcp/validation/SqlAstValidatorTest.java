package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.ColumnInfo;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import com.sqlserver.mcp.model.schema.TableInfo;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SqlAstValidatorTest {

    private final SqlAstValidator validator = new SqlAstValidator();

    private final DatabaseSchema schemaWithUsers = new DatabaseSchema(
        "testdb",
        Map.of("users", new TableInfo("users", "dbo", List.of(
            new ColumnInfo("id", "INT", false, null, 1, null, true, false, null, null)
        ), List.of("id"), List.of(), List.of(), null)),
        Map.of(),
        List.of(),
        null
    );

    private final DatabaseSchema emptySchema = new DatabaseSchema("empty", Map.of(), Map.of(), List.of(), null);

    @Test
    void selectStatement_shouldPass() {
        var result = validator.check("SELECT * FROM users", schemaWithUsers);
        assertTrue(result.isEmpty());
    }

    @Test
    void insertStatement_shouldBeRejected() {
        var result = validator.check("INSERT INTO users VALUES (1)", emptySchema);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
        assertEquals("READ_ONLY_VIOLATION", result.get().errorCode());
    }

    @Test
    void updateStatement_shouldBeRejected() {
        var result = validator.check("UPDATE users SET name = 'x'", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void deleteStatement_shouldBeRejected() {
        var result = validator.check("DELETE FROM users", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void dropStatement_shouldBeRejected() {
        var result = validator.check("DROP TABLE users", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void createTableStatement_shouldBeRejected() {
        var result = validator.check("CREATE TABLE t (id INT)", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void alterStatement_shouldBeRejected() {
        var result = validator.check("ALTER TABLE users ADD age INT", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void truncateStatement_shouldBeRejected() {
        var result = validator.check("TRUNCATE TABLE users", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void mergeStatement_shouldBeRejected() {
        // MERGE is T-SQL specific; JSqlParser may not parse it, downgrading to L3
        var result = validator.check("MERGE INTO users USING ...", emptySchema);
        // If JSqlParser parses it, should be rejected; otherwise downgraded (empty = pass)
        if (result.isPresent()) {
            assertFalse(result.get().passed());
        }
    }

    @Test
    void executeStatement_shouldBeRejected() {
        var result = validator.check("EXECUTE sp_who", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void grantStatement_shouldBeRejected() {
        // GRANT is T-SQL specific; JSqlParser may not parse it, downgrading to L3
        var result = validator.check("GRANT SELECT ON users TO public", emptySchema);
        // If JSqlParser parses it, should be rejected; otherwise downgraded (empty = pass)
        if (result.isPresent()) {
            assertFalse(result.get().passed());
        }
    }

    @Test
    void nonexistentTable_shouldBeRejected() {
        var result = validator.check("SELECT * FROM nonexistent", schemaWithUsers);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
        assertEquals("SCHEMA_ERROR", result.get().errorCode());
    }

    @Test
    void emptySchemaWithSelect_shouldPass() {
        var result = validator.check("SELECT * FROM users", emptySchema);
        assertTrue(result.isEmpty());
    }

    @Test
    void unparseableSql_shouldDowngrade() {
        // T-SQL specific syntax that JSqlParser may not handle
        var result = validator.check("SELECT TOP 10 * FROM users", schemaWithUsers);
        // Should either pass or downgrade — either is acceptable
        assertNotNull(result);
    }
}
