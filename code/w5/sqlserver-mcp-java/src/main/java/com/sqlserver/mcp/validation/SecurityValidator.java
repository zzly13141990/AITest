package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class SecurityValidator implements SqlValidationRule {
    private static final Logger log = LoggerFactory.getLogger(SecurityValidator.class);

    private static final List<String> DANGEROUS_KEYWORDS = List.of(
        "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER",
        "TRUNCATE", "MERGE", "GRANT", "REVOKE", "DENY",
        "EXEC", "EXECUTE", "REPLACE"
    );

    private static final List<String> DANGEROUS_FUNCTIONS = List.of(
        "XP_CMDSHELL", "XP_DELETE_FILE", "XP_REGREAD",
        "SP_CONFIGURE", "SP_EXECUTESQL",
        "SP_OACREATE", "SP_OAMETHOD", "SP_OADESTROY"
    );

    private static final List<String> DANGEROUS_OBJECTS = List.of(
        "OPENROWSET", "OPENDATASOURCE", "OPENQUERY",
        "BULK", "WRITE"
    );

    private static final Pattern SINGLE_LINE_COMMENT = Pattern.compile("--[^\n]*");
    private static final Pattern MULTI_LINE_COMMENT = Pattern.compile("/\\*.*?\\*/", Pattern.DOTALL);
    private static final Pattern ZERO_WIDTH_CHARS = Pattern.compile("[\\u200B-\\u200D\\uFEFF]");

    private static final Map<String, Pattern> DANGEROUS_KEYWORD_PATTERNS = compilePatterns(DANGEROUS_KEYWORDS);
    private static final Map<String, Pattern> DANGEROUS_FUNCTION_PATTERNS = compilePatterns(DANGEROUS_FUNCTIONS);
    private static final Map<String, Pattern> DANGEROUS_OBJECT_PATTERNS = compilePatterns(DANGEROUS_OBJECTS);

    private static Map<String, Pattern> compilePatterns(List<String> words) {
        return words.stream()
            .collect(Collectors.toMap(
                w -> w,
                w -> Pattern.compile("\\b" + Pattern.quote(w) + "\\b")
            ));
    }

    @Override
    public Optional<ValidationResult> check(String sql, DatabaseSchema schema) {
        var processed = preProcess(sql);
        log.debug("SecurityValidator processing SQL ({} chars)", processed.length());

        // 1. Check for dangerous functions (even in SELECT context)
        for (var func : DANGEROUS_FUNCTIONS) {
            if (DANGEROUS_FUNCTION_PATTERNS.get(func).matcher(processed).find()) {
                return Optional.of(ValidationResult.reject(
                    "READ_ONLY_VIOLATION",
                    "Dangerous function detected: " + func,
                    "Only SELECT and WITH statements are allowed",
                    Map.of("keyword", func, "category", "function")
                ));
            }
        }

        // 2. Check for dangerous objects (even in SELECT context)
        for (var obj : DANGEROUS_OBJECTS) {
            if (DANGEROUS_OBJECT_PATTERNS.get(obj).matcher(processed).find()) {
                return Optional.of(ValidationResult.reject(
                    "READ_ONLY_VIOLATION",
                    "Dangerous object detected: " + obj,
                    "Only SELECT and WITH statements are allowed",
                    Map.of("keyword", obj, "category", "object")
                ));
            }
        }

        // 3. Check first keyword
        var firstKeyword = extractFirstKeyword(processed);
        boolean isSelectOrWith = "SELECT".equals(firstKeyword) || "WITH".equals(firstKeyword);

        if (isSelectOrWith) {
            return Optional.empty();
        }

        // 4. For non-SELECT/WITH statements, check dangerous keywords
        for (var kw : DANGEROUS_KEYWORDS) {
            if (DANGEROUS_KEYWORD_PATTERNS.get(kw).matcher(processed).find()) {
                return Optional.of(ValidationResult.reject(
                    "READ_ONLY_VIOLATION",
                    "Read-only violation: " + kw + " statement is not allowed",
                    "Only SELECT and WITH statements are allowed. If you need to modify data, this tool is read-only.",
                    Map.of("keyword", kw, "category", "ddl_dml")
                ));
            }
        }

        // 5. Unknown statement type — reject as potentially unsafe
        return Optional.of(ValidationResult.reject(
            "READ_ONLY_VIOLATION",
            "Unrecognized or unsafe statement type",
            "Only SELECT and WITH statements are allowed",
            Map.of("firstKeyword", firstKeyword != null ? firstKeyword : "(empty)")
        ));
    }

    static String preProcess(String sql) {
        if (sql == null) return "";
        var result = sql.toUpperCase();
        result = SINGLE_LINE_COMMENT.matcher(result).replaceAll("");
        result = MULTI_LINE_COMMENT.matcher(result).replaceAll("");
        result = ZERO_WIDTH_CHARS.matcher(result).replaceAll("");
        result = result.strip();
        return result;
    }

    private static String extractFirstKeyword(String sql) {
        if (sql == null || sql.isBlank()) return null;
        var parts = sql.trim().split("\\s+");
        return parts.length > 0 ? parts[0] : null;
    }
}
