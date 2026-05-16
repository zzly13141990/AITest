package com.sqlserver.mcp.model.query;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class QueryRequestTest {

    @Test
    void constructor_shouldRejectBlankQuery() {
        assertThrows(IllegalArgumentException.class, () -> new QueryRequest("", null, null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> new QueryRequest(null, null, null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> new QueryRequest("  ", null, null, null, null, null));
    }

    @Test
    void constructor_shouldAcceptValidQuery() {
        var req = new QueryRequest("SELECT 1", null, null, null, null, null);
        assertEquals("SELECT 1", req.query());
    }

    @Test
    void isExecuteMode_shouldDefaultToTrue() {
        var req = new QueryRequest("SELECT 1", null, null, null, null, null);
        assertTrue(req.isExecuteMode());
    }

    @Test
    void isExecuteMode_shouldRespectExplicitMode() {
        var sqlOnly = new QueryRequest("SELECT 1", null, QueryRequest.Mode.sql_only, null, null, null);
        assertFalse(sqlOnly.isExecuteMode());

        var execute = new QueryRequest("SELECT 1", null, QueryRequest.Mode.execute, null, null, null);
        assertTrue(execute.isExecuteMode());
    }

    @Test
    void effectivePage_shouldDefaultToOne() {
        var req = new QueryRequest("SELECT 1", null, null, null, null, null);
        assertEquals(1, req.effectivePage());
    }

    @Test
    void effectivePage_shouldReturnSetValue() {
        var req = new QueryRequest("SELECT 1", null, null, 3, null, null);
        assertEquals(3, req.effectivePage());
    }

    @Test
    void effectivePage_shouldClampToMinimum() {
        var req = new QueryRequest("SELECT 1", null, null, 0, null, null);
        assertEquals(1, req.effectivePage());
    }

    @Test
    void effectivePageSize_shouldRespectMax() {
        var req = new QueryRequest("SELECT 1", null, null, null, 99999, null);
        assertEquals(10000, req.effectivePageSize(100, 10000));
    }

    @Test
    void effectivePageSize_shouldClampToMinimum() {
        var req = new QueryRequest("SELECT 1", null, null, null, 0, null);
        assertEquals(1, req.effectivePageSize(100, 10000));
    }

    @Test
    void effectiveOutputFormat_shouldDefaultToText() {
        var req = new QueryRequest("SELECT 1", null, null, null, null, null);
        assertEquals(QueryRequest.OutputFormat.text, req.effectiveOutputFormat());
    }

    @Test
    void effectiveOutputFormat_shouldReturnSetValue() {
        var req = new QueryRequest("SELECT 1", null, null, null, null, QueryRequest.OutputFormat.json);
        assertEquals(QueryRequest.OutputFormat.json, req.effectiveOutputFormat());
    }
}
