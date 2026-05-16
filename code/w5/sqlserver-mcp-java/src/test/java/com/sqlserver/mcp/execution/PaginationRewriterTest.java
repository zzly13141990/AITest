package com.sqlserver.mcp.execution;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PaginationRewriterTest {

    private final PaginationRewriter rewriter = new PaginationRewriter();

    @Test
    void rewrite_shouldProduceCountAndPageSql() {
        var result = rewriter.rewrite("SELECT * FROM users", 1, 10);
        assertTrue(result.countSql().contains("COUNT(*)"));
        assertTrue(result.countSql().contains("SELECT * FROM users"));
        assertTrue(result.pageSql().contains("OFFSET 0 ROWS"));
        assertTrue(result.pageSql().contains("FETCH NEXT 10 ROWS ONLY"));
    }

    @Test
    void rewrite_shouldHandleSecondPage() {
        var result = rewriter.rewrite("SELECT * FROM users", 3, 20);
        assertTrue(result.pageSql().contains("OFFSET 40 ROWS"));  // (3-1)*20 = 40
        assertTrue(result.pageSql().contains("FETCH NEXT 20 ROWS ONLY"));
    }

    @Test
    void rewrite_shouldHandleInvalidPageNumbers() {
        var result = rewriter.rewrite("SELECT * FROM users", 0, 0);
        assertTrue(result.pageSql().contains("OFFSET 0 ROWS"));
        assertTrue(result.pageSql().contains("FETCH NEXT 10 ROWS ONLY"));
    }

    @Test
    void rewrite_shouldPreserveOrderBy() {
        var result = rewriter.rewrite("SELECT * FROM users ORDER BY name", 1, 10);
        assertTrue(result.pageSql().contains("ORDER BY name"));
    }

    @Test
    void rewrite_shouldAddOrderByWhenMissing() {
        var result = rewriter.rewrite("SELECT * FROM users", 1, 10);
        assertTrue(result.pageSql().contains("ORDER BY (SELECT NULL)") || result.pageSql().contains("ORDER BY"));
    }

    @Test
    void rewrite_shouldHandleCte() {
        var sql = "WITH cte AS (SELECT id FROM users) SELECT * FROM cte";
        var result = rewriter.rewrite(sql, 1, 10);
        assertTrue(result.countSql().contains("COUNT(*)"));
        assertTrue(result.pageSql().contains("OFFSET"));
    }

    @Test
    void rewrite_shouldHandleGroupBy() {
        var sql = "SELECT department, COUNT(*) FROM users GROUP BY department";
        var result = rewriter.rewrite(sql, 1, 10);
        assertNotNull(result);
        assertNotNull(result.countSql());
        assertNotNull(result.pageSql());
    }

    @Test
    void rewrite_shouldHandleTopClause() {
        var sql = "SELECT TOP 10 * FROM users";
        var result = rewriter.rewrite(sql, 1, 10);
        assertNotNull(result);
        assertNotNull(result.countSql());
    }
}
