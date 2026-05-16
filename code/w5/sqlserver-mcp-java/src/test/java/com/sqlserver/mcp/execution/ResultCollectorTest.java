package com.sqlserver.mcp.execution;

import org.junit.jupiter.api.Test;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Types;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResultCollectorTest {

    private ResultSet mockResultSet(int columnCount, Object[][] data) throws Exception {
        var rs = mock(ResultSet.class);
        var meta = mock(ResultSetMetaData.class);
        when(rs.getMetaData()).thenReturn(meta);
        when(meta.getColumnCount()).thenReturn(columnCount);
        for (int i = 1; i <= columnCount; i++) {
            when(meta.getColumnLabel(i)).thenReturn("col" + i);
        }

        var rowIndex = new int[]{0};
        when(rs.next()).thenAnswer(invocation -> {
            boolean hasNext = rowIndex[0] < data.length;
            if (hasNext) rowIndex[0]++;
            return hasNext;
        });

        when(rs.getObject(anyInt())).thenAnswer(invocation -> {
            var col = (int) invocation.getArgument(0) - 1;
            var row = rowIndex[0] - 1;
            if (row >= 0 && row < data.length && col >= 0 && col < data[row].length) {
                return data[row][col];
            }
            return null;
        });
        when(rs.wasNull()).thenReturn(false);

        return rs;
    }

    @Test
    void collect_shouldReturnAllRows() throws Exception {
        var data = new Object[][]{
            {1, "Alice"},
            {2, "Bob"},
            {3, "Charlie"}
        };
        var rs = mockResultSet(2, data);
        var collector = new ResultCollector(100, 1_000_000);
        var result = collector.collect(rs);

        assertEquals(3, result.totalRows());
        assertEquals(3, result.rows().size());
        assertFalse(result.truncated());
    }

    @Test
    void collect_shouldTruncateByMaxRows() throws Exception {
        var data = new Object[10][2];
        for (int i = 0; i < 10; i++) data[i] = new Object[]{i, "row" + i};
        var rs = mockResultSet(2, data);
        var collector = new ResultCollector(3, 1_000_000);
        var result = collector.collect(rs);

        assertEquals(3, result.rows().size());
        assertTrue(result.truncated());
    }

    @Test
    void collect_shouldTruncateByMaxBytes() throws Exception {
        var data = new Object[][]{
            {1, "A very long string that will consume many bytes"},
            {2, "Another very long string that will consume many bytes"}
        };
        var rs = mockResultSet(2, data);
        var collector = new ResultCollector(1000, 10);
        var result = collector.collect(rs);

        assertTrue(result.truncated() || result.rows().size() < 2);
    }

    @Test
    void collect_shouldHandleEmptyResult() throws Exception {
        var rs = mockResultSet(2, new Object[0][]);
        var collector = new ResultCollector(100, 1_000_000);
        var result = collector.collect(rs);

        assertEquals(0, result.totalRows());
        assertTrue(result.rows().isEmpty());
        assertFalse(result.truncated());
    }

    @Test
    void collect_shouldConvertNullValues() throws Exception {
        var rs = mock(ResultSet.class);
        var meta = mock(ResultSetMetaData.class);
        when(rs.getMetaData()).thenReturn(meta);
        when(meta.getColumnCount()).thenReturn(1);
        when(meta.getColumnLabel(1)).thenReturn("col");
        when(rs.next()).thenReturn(true, false);
        when(rs.getObject(1)).thenReturn(null);
        when(rs.wasNull()).thenReturn(true);

        var collector = new ResultCollector(100, 1_000_000);
        var result = collector.collect(rs);

        assertEquals(1, result.rows().size());
        assertNull(result.rows().getFirst().getFirst());
    }

    @Test
    void collect_shouldHandleSqlDateTypes() throws Exception {
        var rs = mock(ResultSet.class);
        var meta = mock(ResultSetMetaData.class);
        when(rs.getMetaData()).thenReturn(meta);
        when(meta.getColumnCount()).thenReturn(3);
        when(meta.getColumnLabel(1)).thenReturn("d");
        when(meta.getColumnLabel(2)).thenReturn("t");
        when(meta.getColumnLabel(3)).thenReturn("ts");
        when(rs.next()).thenReturn(true, false);
        when(rs.getObject(1)).thenReturn(java.sql.Date.valueOf("2024-01-15"));
        when(rs.getObject(2)).thenReturn(java.sql.Time.valueOf("10:30:00"));
        when(rs.getObject(3)).thenReturn(java.sql.Timestamp.valueOf("2024-01-15 10:30:00"));
        when(rs.wasNull()).thenReturn(false);

        var collector = new ResultCollector(100, 1_000_000);
        var result = collector.collect(rs);

        assertEquals(1, result.rows().size());
        var row = result.rows().getFirst();
        assertEquals(java.time.LocalDate.of(2024, 1, 15), row.get(0));
        assertEquals(java.time.LocalTime.of(10, 30, 0), row.get(1));
        assertEquals(java.time.LocalDateTime.of(2024, 1, 15, 10, 30, 0), row.get(2));
    }
}
