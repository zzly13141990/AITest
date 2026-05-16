package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.model.error.LlmOutputParseException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SqlExtractorTest {

    @Test
    void shouldExtractFromSqlBlock() {
        var input = "Here is the SQL:\n```sql\nSELECT * FROM users\n```";
        assertEquals("SELECT * FROM users", SqlExtractor.extract(input));
    }

    @Test
    void shouldExtractFromSqlBlockWithLanguageTag() {
        var input = "```sql\nSELECT COUNT(*) FROM orders\n```";
        assertEquals("SELECT COUNT(*) FROM orders", SqlExtractor.extract(input));
    }

    @Test
    void shouldExtractFromGenericCodeBlockWhenLooksLikeSql() {
        var input = "```\nSELECT name, email FROM users\n```";
        assertEquals("SELECT name, email FROM users", SqlExtractor.extract(input));
    }

    @Test
    void shouldExtractSqlWithoutCodeBlocks() {
        var input = "Here is the result: SELECT TOP 10 * FROM products";
        assertEquals("SELECT TOP 10 * FROM products", SqlExtractor.extract(input));
    }

    @Test
    void shouldExtractWithStatement() {
        var input = "WITH cte AS (SELECT * FROM users) SELECT * FROM cte";
        assertEquals("WITH cte AS (SELECT * FROM users) SELECT * FROM cte", SqlExtractor.extract(input));
    }

    @Test
    void shouldExtractSqlStartingWithComment() {
        var input = "-- this is a comment\nSELECT * FROM users";
        assertEquals("-- this is a comment\nSELECT * FROM users", SqlExtractor.extract(input));
    }

    @Test
    void shouldStripMarkdownWhenNeeded() {
        var input = "**Result:**\n**SELECT * FROM users**";
        assertEquals("SELECT * FROM users", SqlExtractor.extract(input));
    }

    @Test
    void shouldThrowOnNullInput() {
        assertThrows(LlmOutputParseException.class, () -> SqlExtractor.extract(null));
    }

    @Test
    void shouldThrowOnBlankInput() {
        assertThrows(LlmOutputParseException.class, () -> SqlExtractor.extract("   "));
    }

    @Test
    void shouldThrowOnNonSqlContent() {
        assertThrows(LlmOutputParseException.class, () -> SqlExtractor.extract("Hello, how are you?"));
    }

    @Test
    void shouldExtractSqlBlockEvenWithExtraContent() {
        var input = "Some text before\n```sql\nSELECT id, name FROM users WHERE id = 1\n```\nSome text after";
        assertEquals("SELECT id, name FROM users WHERE id = 1", SqlExtractor.extract(input));
    }
}
