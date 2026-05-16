package com.sqlserver.mcp.execution;

import org.junit.jupiter.api.Test;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TextFormatterTest {

    private final TextFormatter formatter = new TextFormatter();

    @Test
    void format_shouldProduceMarkdownTable() {
        var data = new CollectResult(
            List.of("id", "name"),
            List.of(List.of(1, "Alice"), List.of(2, "Bob")),
            2, false, 100
        );
        var output = formatter.format(data);
        assertTrue(output.contains("| id | name |"));
        assertTrue(output.contains("| --- | --- |"));
        assertTrue(output.contains("| 1"));
        assertTrue(output.contains("Alice"));
        assertTrue(output.contains("Bob"));
    }

    @Test
    void format_shouldHandleEmptyResult() {
        var data = new CollectResult(
            List.of("id"), List.of(),
            0, false, 0
        );
        var output = formatter.format(data);
        assertTrue(output.contains("空结果"));
    }

    @Test
    void format_shouldDisplayNullAsNull() {
        var data = new CollectResult(
            List.of("name"),
            List.of(List.of("Alice"), Collections.singletonList(null), List.of("Bob")),
            3, false, 100
        );
        var output = formatter.format(data);
        assertTrue(output.contains("NULL"));
    }

    @Test
    void format_shouldShowTruncationWarning() {
        var data = new CollectResult(
            List.of("id"),
            List.of(List.of(1), List.of(2)),
            2, true, 100
        );
        var output = formatter.format(data);
        assertTrue(output.contains("截断"));
    }

    @Test
    void format_shouldFormatNumbers() {
        var data = new CollectResult(
            List.of("val"),
            List.of(List.of(42), List.of(3.14)),
            2, false, 100
        );
        var output = formatter.format(data);
        assertTrue(output.contains("42"));
    }
}
