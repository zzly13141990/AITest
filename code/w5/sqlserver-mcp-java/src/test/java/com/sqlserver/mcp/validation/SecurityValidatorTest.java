package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SecurityValidatorTest {

    private final SecurityValidator validator = new SecurityValidator();
    private final DatabaseSchema emptySchema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), null);

    @Test
    void selectStatement_shouldPass() {
        var result = validator.check("SELECT * FROM users", emptySchema);
        assertTrue(result.isEmpty());
    }

    @Test
    void withStatement_shouldPass() {
        var result = validator.check("WITH cte AS (SELECT * FROM users) SELECT * FROM cte", emptySchema);
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
        var result = validator.check("UPDATE users SET name = 'test'", emptySchema);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
    }

    @Test
    void deleteStatement_shouldBeRejected() {
        var result = validator.check("DELETE FROM users", emptySchema);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
    }

    @Test
    void dropStatement_shouldBeRejected() {
        var result = validator.check("DROP TABLE users", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void createStatement_shouldBeRejected() {
        var result = validator.check("CREATE TABLE users (id INT)", emptySchema);
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
    void execStatement_shouldBeRejected() {
        var result = validator.check("EXEC sp_who", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void dangerousFunction_shouldBeRejected() {
        var result = validator.check("SELECT * FROM users WHERE name = xp_cmdshell('dir')", emptySchema);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
    }

    @Test
    void dangerousObject_shouldBeRejected() {
        var result = validator.check("SELECT * FROM OPENROWSET(...)", emptySchema);
        assertTrue(result.isPresent());
        assertFalse(result.get().passed());
    }

    @Test
    void unknownStatementType_shouldBeRejected() {
        var result = validator.check("MERGE INTO users USING ...", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void nullInput_shouldReturnEmptyForPreprocess() {
        assertEquals("", SecurityValidator.preProcess(null));
    }

    @Test
    void preProcess_shouldStripComments() {
        var result = SecurityValidator.preProcess("SELECT * FROM users -- comment");
        assertEquals("SELECT * FROM USERS", result);
    }

    @Test
    void preProcess_shouldStripMultiLineComments() {
        var result = SecurityValidator.preProcess("SELECT * /* block */ FROM users");
        assertEquals("SELECT *  FROM USERS", result);
    }

    @Test
    void preProcess_shouldStripZeroWidthChars() {
        var result = SecurityValidator.preProcess("SELECT​* FROM users");
        assertEquals("SELECT* FROM USERS", result);
    }

    @Test
    void grantStatement_shouldBeRejected() {
        var result = validator.check("GRANT SELECT ON users TO public", emptySchema);
        assertTrue(result.isPresent());
    }

    @Test
    void revokeStatement_shouldBeRejected() {
        // REVOKE is in dangerous keywords; first keyword after uppercase is REVOKE
        var result = validator.check("REVOKE SELECT ON users FROM public", emptySchema);
        assertTrue(result.isPresent());
    }
}
