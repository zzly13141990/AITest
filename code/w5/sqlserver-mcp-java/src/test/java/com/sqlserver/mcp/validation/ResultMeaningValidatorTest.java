package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ResultMeaningValidatorTest {

    private final ResultMeaningValidator validator = new ResultMeaningValidator();

    @Test
    void check_shouldAlwaysReturnEmpty() {
        var schema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), null);
        var result = validator.check("SELECT * FROM users", schema);
        assertTrue(result.isEmpty());
    }

    @Test
    void check_shouldPassForAnySql() {
        var schema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), null);
        assertTrue(validator.check("DROP TABLE users", schema).isEmpty());
        assertTrue(validator.check("", schema).isEmpty());
        assertTrue(validator.check(null, schema).isEmpty());
    }
}
