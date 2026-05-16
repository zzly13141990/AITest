package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

public class SchemaContextBuilder {
    private static final Logger log = LoggerFactory.getLogger(SchemaContextBuilder.class);

    private static final Set<String> STOP_WORDS = Set.of(
        "select", "from", "where", "the", "a", "an", "in", "on", "for", "to", "with",
        "show", "me", "all", "list", "get", "find", "give", "tell", "how", "what",
        "many", "each", "every"
    );

    private final LlmConfig llmConfig;

    public SchemaContextBuilder(LlmConfig llmConfig) {
        this.llmConfig = llmConfig;
    }

    public String buildContext(DatabaseSchema schema, String query, int tokenBudget) {
        var keywords = extractKeywords(query);
        var maxContextTokens = (int) (tokenBudget * 0.5);

        // Score tables by keyword relevance
        var tableScores = scoreTables(schema, keywords);

        // Build context text
        var context = new StringBuilder();
        context.append("Database: ").append(schema.databaseName()).append("\n\n");

        var relevantTables = new LinkedHashSet<String>();
        var otherTables = new ArrayList<String>();

        // Sort tables by relevance score descending
        tableScores.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .forEach(e -> {
                if (e.getValue() > 0) {
                    relevantTables.add(e.getKey());
                } else {
                    otherTables.add(e.getKey());
                }
            });

        // First pass: include full details for relevant tables
        var detailSb = new StringBuilder();
        for (var tableName : relevantTables) {
            var table = schema.tables().get(tableName);
            if (table == null) continue;
            var tableDetail = formatTableDetail(table);
            detailSb.append(tableDetail);
        }

        // Check if context exceeds budget
        var currentContext = context.toString() + detailSb;
        var estimatedTokens = estimateTokens(currentContext);

        if (estimatedTokens <= maxContextTokens) {
            // Add all other tables as name-only
            for (var tableName : otherTables) {
                detailSb.append("Table: ").append(tableName).append("\n\n");
            }
        } else {
            // Full details for relevant tables already added, just add other table names
            // But if even relevant tables exceed budget, trim to just names
            var relevantTokenEstimate = estimateTokens(context.toString() + detailSb);
            if (relevantTokenEstimate > maxContextTokens * 0.9) {
                // Only include table names
                detailSb = new StringBuilder();
                for (var tableName : relevantTables) {
                    detailSb.append("Table: ").append(tableName).append("\n");
                }
                for (var tableName : otherTables) {
                    detailSb.append("Table: ").append(tableName).append("\n");
                }
            } else {
                // Relevant tables fit, add other table names
                for (var tableName : otherTables) {
                    detailSb.append("Table: ").append(tableName).append("\n\n");
                }
            }
        }

        context.append(detailSb);

        // Add views
        if (!schema.views().isEmpty()) {
            context.append("\nViews:\n");
            for (var view : schema.views().values()) {
                context.append("  - ").append(view.schema()).append(".").append(view.name()).append("\n");
            }
        }

        var result = context.toString();
        log.debug("Built schema context: {} chars for query '{}'", result.length(), query);
        return result;
    }

    private List<String> extractKeywords(String query) {
        if (query == null || query.isBlank()) return List.of();
        return Arrays.stream(query.toLowerCase().split("[^a-zA-Z0-9_]+"))
            .filter(w -> w.length() > 1)
            .filter(w -> !STOP_WORDS.contains(w))
            .distinct()
            .toList();
    }

    private Map<String, Integer> scoreTables(DatabaseSchema schema, List<String> keywords) {
        var scores = new HashMap<String, Integer>();
        if (keywords.isEmpty()) {
            for (var tableName : schema.tables().keySet()) {
                scores.put(tableName, 0);
            }
            return scores;
        }

        for (var entry : schema.tables().entrySet()) {
            var tableName = entry.getKey();
            var table = entry.getValue();
            var score = 0;

            var normalizedTableName = tableName.toLowerCase();
            for (var kw : keywords) {
                // Exact match on table name
                if (normalizedTableName.equals(kw)) score += 10;
                // Partial match on table name
                else if (normalizedTableName.contains(kw)) score += 5;
            }

            // Score by column name matches
            for (var col : table.columns()) {
                var normalizedColName = col.name().toLowerCase();
                for (var kw : keywords) {
                    if (normalizedColName.equals(kw)) score += 3;
                    else if (normalizedColName.contains(kw)) score += 1;
                }
            }

            scores.put(tableName, score);
        }
        return scores;
    }

    private String formatTableDetail(com.sqlserver.mcp.model.schema.TableInfo table) {
        var sb = new StringBuilder();
        sb.append("Table: ").append(table.schema()).append(".").append(table.name()).append("\n");
        sb.append("Columns:\n");
        for (var col : table.columns()) {
            sb.append("  - ").append(col.name()).append(" (").append(col.dataType());
            if (col.maxLength() != null) {
                sb.append("(").append(col.maxLength()).append(")");
            }
            if (col.primaryKey()) sb.append(", PK");
            if (col.nullable()) sb.append(", nullable");
            sb.append(")\n");
        }
        if (!table.foreignKeys().isEmpty()) {
            sb.append("Foreign Keys:\n");
            for (var fk : table.foreignKeys()) {
                sb.append("  - ").append(fk.columnName())
                    .append(" → ").append(fk.referencedSchema()).append(".").append(fk.referencedTable())
                    .append(".").append(fk.referencedColumn()).append("\n");
            }
        }
        if (!table.indexes().isEmpty()) {
            sb.append("Indexes:\n");
            for (var idx : table.indexes()) {
                sb.append("  - ").append(idx.name()).append(" (").append(idx.type());
                if (idx.unique()) sb.append(", unique");
                sb.append(")\n");
            }
        }
        sb.append("\n");
        return sb.toString();
    }

    // Rough token estimate: ~4 chars per token
    private int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        return text.length() / 4 + 1;
    }
}
