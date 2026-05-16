package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.model.error.SqlObjectNotFoundException;
import com.sqlserver.mcp.model.error.SqlSyntaxException;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.ResultSet;
import java.util.*;
import java.util.regex.Pattern;

public class ParseOnlyValidator implements SqlValidationRule {
    private static final Logger log = LoggerFactory.getLogger(ParseOnlyValidator.class);

    private static final Pattern TABLE_REFERENCE = Pattern.compile(
        "(?:FROM|JOIN)\\s+(?:\\[?(\\w+)\\]?\\.)?\\[?(\\w+)\\]?(?:\\s+(?:AS\\s+)?(?!JOIN\\b|ON\\b|WHERE\\b|ORDER\\b|GROUP\\b|HAVING\\b|LIMIT\\b|OFFSET\\b|FETCH\\b|SET\\b|INTO\\b|AND\\b|OR\\b|NOT\\b)\\w+)?",
        Pattern.CASE_INSENSITIVE
    );

    private final ConnectionPoolManager poolManager;

    public ParseOnlyValidator(ConnectionPoolManager poolManager) {
        this.poolManager = poolManager;
    }

    @Override
    public Optional<ValidationResult> check(String sql, DatabaseSchema schema) {
        var database = schema.databaseName();
        try {
            poolManager.withConnection(database, conn -> {
                // Step 1: SET PARSEONLY ON and execute SQL to check syntax
                try (var stmt = conn.createStatement()) {
                    stmt.execute("SET PARSEONLY ON");
                    try {
                        stmt.execute(sql);
                        log.debug("SQL syntax validation passed via SET PARSEONLY ON");
                    } catch (Exception e) {
                        throw new SqlSyntaxException(sql, e.getMessage());
                    } finally {
                        stmt.execute("SET PARSEONLY OFF");
                    }
                }

                // Step 2: Describe result set structure
                try (var stmt = conn.createStatement()) {
                    var escapedSql = sql.replace("'", "''");
                    var describeSql = "EXEC sys.dm_exec_describe_first_result_set N'" + escapedSql + "', null, 0";
                    try (var rs = stmt.executeQuery(describeSql)) {
                        // We just check it executes successfully — detailed metadata is a bonus
                        log.debug("Result set description query executed successfully");
                    }
                }

                // Step 3: Check referenced tables exist in schema
                var referencedTables = extractTableNames(sql);
                for (var tableName : referencedTables) {
                    var normalizedName = normalizeTableName(tableName);
                    var existsInSchema = schema.tables().values().stream()
                        .anyMatch(t -> t.name().equalsIgnoreCase(normalizedName)
                            || t.name().equalsIgnoreCase(tableName));
                    if (!existsInSchema) {
                        log.warn("Referenced table '{}' not found in schema for database '{}'", tableName, database);
                        // Informational only — the table might exist but not be in the cached schema
                    }
                }

                return null;
            });
        } catch (SqlSyntaxException e) {
            return Optional.of(ValidationResult.reject(
                "SYNTAX_ERROR",
                "SQL syntax error: " + e.getMessage(),
                "Check the SQL statement syntax and try again",
                Map.of("validator", "ParseOnlyValidator", "originalMessage", e.getMessage())
            ));
        } catch (Exception e) {
            log.warn("ParseOnlyValidator unexpected error: {}", e.getMessage());
            return Optional.of(ValidationResult.reject(
                "VALIDATION_ERROR",
                "SQL validation failed: " + e.getMessage(),
                "The SQL could not be validated against the database",
                Map.of("validator", "ParseOnlyValidator")
            ));
        }

        return Optional.empty();
    }

    static Set<String> extractTableNames(String sql) {
        var matcher = TABLE_REFERENCE.matcher(sql);
        var tables = new LinkedHashSet<String>();
        while (matcher.find()) {
            var schema = matcher.group(1);
            var table = matcher.group(2);
            if (table != null) {
                tables.add(schema != null ? schema + "." + table : table);
            }
        }
        return tables;
    }

    private static String normalizeTableName(String name) {
        if (name == null) return "";
        return name.replace("[", "").replace("]", "").replace("\"", "").strip();
    }
}
