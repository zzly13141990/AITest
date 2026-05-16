package com.sqlserver.mcp.llm;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PromptBuilderTest {

    @Test
    void buildSqlPrompt_shouldIncludeSchemaContext() {
        var prompt = PromptBuilder.buildSqlPrompt("TABLE users (id INT)", "find all users");
        assertTrue(prompt.contains("TABLE users (id INT)"));
        assertTrue(prompt.contains("find all users"));
        assertTrue(prompt.contains("T-SQL expert"));
    }

    @Test
    void buildSqlPrompt_shouldIncludeRules() {
        var prompt = PromptBuilder.buildSqlPrompt("schema", "query");
        assertTrue(prompt.contains("schema-qualified table names"));
        assertTrue(prompt.contains("TOP instead of LIMIT"));
        assertTrue(prompt.contains("GETDATE()"));
    }

    @Test
    void buildValidationPrompt_shouldIncludeAllParts() {
        var prompt = PromptBuilder.buildValidationPrompt("find users", "SELECT * FROM users", "sample data");
        assertTrue(prompt.contains("find users"));
        assertTrue(prompt.contains("SELECT * FROM users"));
        assertTrue(prompt.contains("sample data"));
        assertTrue(prompt.contains("0.0 to 1.0"));
    }

    @Test
    void buildValidationPrompt_shouldHandleNullParts() {
        var prompt = PromptBuilder.buildValidationPrompt(null, null, null);
        assertNotNull(prompt);
    }
}
