package com.etyy.querytool.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PageService Unit Tests")
class PageServiceTest {

    private PageService pageService;

    @BeforeEach
    void setUp() {
        pageService = new PageService();
    }

    @Test
    @DisplayName("MySQL pagination SQL")
    void testMySqlPageSql() {
        String sql = "SELECT * FROM users ORDER BY id";
        String result = pageService.buildPageSql(sql, 2, 10, "mysql");
        assertEquals("SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 10", result);
    }

    @Test
    @DisplayName("SQL Server pagination SQL")
    void testSqlServerPageSql() {
        String sql = "SELECT * FROM users ORDER BY id";
        String result = pageService.buildPageSql(sql, 1, 20, "sqlserver");
        assertTrue(result.contains("OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY"));
    }

    @Test
    @DisplayName("Oracle pagination SQL")
    void testOraclePageSql() {
        String sql = "SELECT * FROM users ORDER BY id";
        String result = pageService.buildPageSql(sql, 3, 50, "oracle");
        assertTrue(result.contains("OFFSET 100 ROWS FETCH NEXT 50 ROWS ONLY"));
    }

    @Test
    @DisplayName("Count SQL strips ORDER BY")
    void testBuildCountSql() {
        String sql = "SELECT * FROM users ORDER BY name";
        String countSql = pageService.buildCountSql(sql);
        assertTrue(countSql.startsWith("SELECT COUNT(*) FROM"));
        assertTrue(countSql.contains("AS cnt"));
        // ORDER BY should be stripped
        assertFalse(countSql.toUpperCase().contains("ORDER BY"),
                "COUNT SQL should not contain ORDER BY");
    }

    @Test
    @DisplayName("Count SQL for simple query")
    void testBuildCountSqlSimple() {
        String sql = "SELECT id, name FROM users";
        String countSql = pageService.buildCountSql(sql);
        assertEquals("SELECT COUNT(*) FROM (SELECT id, name FROM users) AS cnt", countSql);
    }
}
