package com.etyy.querytool.security;

import com.etyy.querytool.model.dto.PageParam;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.statement.select.Select;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SqlValidator {

    private static final Logger log = LoggerFactory.getLogger(SqlValidator.class);

    /**
     * Validates SQL for safety. Returns error message if invalid, null if valid.
     */
    public String validate(String sql, PageParam page) {
        if (sql == null || sql.trim().isEmpty()) {
            return "SQL语句不能为空";
        }

        // 1. Regex pre-check: must start with SELECT
        if (!SqlParserWrapper.startsWithSelect(sql)) {
            return "仅允许 SELECT 查询语句";
        }

        // 2. AST parsing
        Select select;
        try {
            select = SqlParserWrapper.parseAsSelect(sql);
        } catch (JSQLParserException e) {
            log.warn("SQL parse failed: {}", e.getMessage());
            return "SQL 语句无法解析";
        }

        // 3. If has page param, enforce ORDER BY
        if (page != null) {
            if (!SqlParserWrapper.hasOuterOrderBy(select)) {
                return "使用分页查询时 SQL 必须包含 ORDER BY 子句";
            }
        }

        // 4. Dangerous keywords check (as a fallback)
        if (SqlParserWrapper.containsDangerousKeywords(sql)) {
            return "SQL 包含被禁止的操作";
        }

        return null; // validation passed
    }
}
