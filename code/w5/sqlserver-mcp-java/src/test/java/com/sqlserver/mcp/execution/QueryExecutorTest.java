package com.sqlserver.mcp.execution;

import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig.Features;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.datasource.SqlFunction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryExecutorTest {

    @Mock
    private ConnectionPoolManager poolManager;

    private final QueryConfig queryConfig = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(true));
    private final PaginationRewriter rewriter = new PaginationRewriter();
    private final ResultCollector collector = new ResultCollector(100, 52_428_800);

    @Test
    void execute_shouldReturnResult() {
        when(poolManager.withConnection(eq("testdb"), anyString(), any()))
            .thenAnswer(invocation -> {
                String sql = invocation.getArgument(1);
                if (sql.contains("COUNT(*)")) {
                    return 42;
                }
                @SuppressWarnings("unchecked")
                SqlFunction<ResultSet, CollectResult> mapper = invocation.getArgument(2);
                var rs = mock(ResultSet.class);
                var meta = mock(ResultSetMetaData.class);
                when(rs.getMetaData()).thenReturn(meta);
                when(meta.getColumnCount()).thenReturn(1);
                when(meta.getColumnLabel(1)).thenReturn("cnt");
                when(rs.next()).thenReturn(true, false);
                when(rs.getObject(1)).thenReturn(42);
                when(rs.wasNull()).thenReturn(false);
                return mapper.apply(rs);
            });

        var executor = new QueryExecutor(poolManager, rewriter, collector, queryConfig);
        var result = executor.execute("SELECT * FROM users", "testdb", 1, 10);

        assertNotNull(result);
        assertEquals(42, result.totalRows());
        assertNotNull(result.data());
        assertNotNull(result.executedSql());
    }

    @Test
    void execute_shouldHandleDefaultPage() {
        when(poolManager.withConnection(eq("testdb"), anyString(), any()))
            .thenAnswer(invocation -> {
                String sql = invocation.getArgument(1);
                if (sql.contains("COUNT(*)")) {
                    return 5;
                }
                @SuppressWarnings("unchecked")
                SqlFunction<ResultSet, CollectResult> mapper = invocation.getArgument(2);
                var rs = mock(ResultSet.class);
                var meta = mock(ResultSetMetaData.class);
                when(rs.getMetaData()).thenReturn(meta);
                when(meta.getColumnCount()).thenReturn(1);
                when(meta.getColumnLabel(1)).thenReturn("c");
                when(rs.next()).thenReturn(true, false);
                when(rs.getObject(1)).thenReturn(1);
                when(rs.wasNull()).thenReturn(false);
                return mapper.apply(rs);
            });

        var executor = new QueryExecutor(poolManager, rewriter, collector, queryConfig);
        var result = executor.execute("SELECT * FROM users", "testdb");

        assertNotNull(result);
        assertTrue(result.totalRows() >= 0);
    }
}
