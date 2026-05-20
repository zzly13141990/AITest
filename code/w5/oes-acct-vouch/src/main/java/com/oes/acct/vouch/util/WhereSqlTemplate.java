package com.oes.acct.vouch.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public enum WhereSqlTemplate {
    // Standard templates with parameterized placeholders
    DEFAULT("1=1", Map.of()),
    BY_COMP("comp_code = ?", Map.of("compCode", 1)),
    BY_COMP_COPY("comp_code = ? AND copy_code = ?", Map.of("compCode", 1, "copyCode", 2)),
    BY_COMP_COPY_YEAR("comp_code = ? AND copy_code = ? AND acct_year = ?",
            Map.of("compCode", 1, "copyCode", 2, "acctYear", 3)),
    BY_STANDARD("is_stop = '0'", Map.of());

    private final String template;
    private final Map<String, Integer> parameterIndex;

    WhereSqlTemplate(String template, Map<String, Integer> parameterIndex) {
        this.template = template;
        this.parameterIndex = parameterIndex;
    }

    public String getTemplate() {
        return template;
    }

    public Map<String, Integer> getParameterIndex() {
        return parameterIndex;
    }

    // Normalized pattern strings for strict structural matching
    private static final String PATTERN_BY_COMP = "comp_code = ?";
    private static final String PATTERN_BY_COMP_COPY = "comp_code = ? and copy_code = ?";
    private static final String PATTERN_BY_COMP_COPY_YEAR = "comp_code = ? and copy_code = ? and acct_year = ?";
    private static final String PATTERN_BY_STANDARD = "is_stop = '0'";

    private static final Map<String, WhereSqlTemplate> CACHE = new ConcurrentHashMap<>();

    /**
     * Resolve a where_sql string to a safe template.
     * Only allows known safe patterns via exact structural match. Falls back to DEFAULT if unrecognized.
     */
    public static WhereSqlTemplate resolve(String whereSql) {
        if (whereSql == null || whereSql.trim().isEmpty()) {
            return DEFAULT;
        }

        return CACHE.computeIfAbsent(whereSql.trim(), sql -> {
            String normalized = sql.replaceAll("\\s+", " ")
                    .trim()
                    .toLowerCase()
                    // Normalize named placeholders to '?' for matching
                    .replace(":compcode", "?")
                    .replace(":copycode", "?")
                    .replace(":acctyear", "?");

            if (PATTERN_BY_COMP_COPY_YEAR.equals(normalized)) return BY_COMP_COPY_YEAR;
            if (PATTERN_BY_COMP_COPY.equals(normalized)) return BY_COMP_COPY;
            if (PATTERN_BY_COMP.equals(normalized)) return BY_COMP;
            if (PATTERN_BY_STANDARD.equals(normalized)) return BY_STANDARD;

            return DEFAULT;
        });
    }
}
