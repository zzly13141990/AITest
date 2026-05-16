package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.model.error.LlmOutputParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

public final class SqlExtractor {
    private static final Logger log = LoggerFactory.getLogger(SqlExtractor.class);

    private static final Pattern SQL_BLOCK_PATTERN = Pattern.compile(
        "```sql\\s*\\n?(.*?)\\n?```", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern CODE_BLOCK_PATTERN = Pattern.compile(
        "```\\s*\\n?(.*?)\\n?```", Pattern.DOTALL);

    private SqlExtractor() {}

    public static String extract(String llmOutput) {
        if (llmOutput == null || llmOutput.isBlank()) {
            throw new LlmOutputParseException("Empty LLM output");
        }

        var trimmed = llmOutput.trim();

        // Priority 1: Look for ```sql ... ``` code blocks
        var sqlMatcher = SQL_BLOCK_PATTERN.matcher(trimmed);
        if (sqlMatcher.find()) {
            var sql = sqlMatcher.group(1).trim();
            if (!sql.isBlank()) {
                log.debug("Extracted SQL from ```sql block");
                return sql;
            }
        }

        // Priority 2: Look for ``` ... ``` generic code blocks
        var codeMatcher = CODE_BLOCK_PATTERN.matcher(trimmed);
        if (codeMatcher.find()) {
            var content = codeMatcher.group(1).trim();
            if (looksLikeSql(content)) {
                log.debug("Extracted SQL from generic code block");
                return content;
            }
        }

        // Priority 3: Look for first SELECT/WITH or SQL comment
        var sqlStart = findSqlStart(trimmed);
        if (sqlStart >= 0) {
            var sql = trimmed.substring(sqlStart).trim();
            // Strip any remaining markdown formatting (bold, italic) from the extracted SQL
            sql = sql.replaceAll("\\*\\*", "").replaceAll("__", "").trim();
            log.debug("Extracted SQL by finding start keyword");
            return sql;
        }

        // Priority 4: Strip markdown formatting
        var stripped = stripMarkdown(trimmed);
        if (looksLikeSql(stripped)) {
            log.debug("Extracted SQL after stripping markdown");
            return stripped;
        }

        throw new LlmOutputParseException(llmOutput);
    }

    private static boolean looksLikeSql(String content) {
        if (content == null || content.isBlank()) return false;
        var upper = content.trim().toUpperCase();
        return upper.startsWith("SELECT")
            || upper.startsWith("WITH")
            || upper.startsWith("--")
            || upper.startsWith("/*");
    }

    private static int findSqlStart(String text) {
        var upper = text.toUpperCase();
        var selectIdx = upper.indexOf("SELECT ");
        var withIdx = upper.indexOf("WITH ");
        var commentIdx = upper.indexOf("--");

        var earliest = Integer.MAX_VALUE;
        if (selectIdx >= 0) earliest = Math.min(earliest, selectIdx);
        if (withIdx >= 0) earliest = Math.min(earliest, withIdx);
        if (commentIdx >= 0) earliest = Math.min(earliest, commentIdx);

        return earliest < Integer.MAX_VALUE ? earliest : -1;
    }

    private static String stripMarkdown(String text) {
        return text.replaceAll("\\*\\*", "")
            .replaceAll("__", "")
            .replaceAll("^[*\\-+]\\s+", "")
            .replaceAll("^#+\\s+", "")
            .trim();
    }
}
