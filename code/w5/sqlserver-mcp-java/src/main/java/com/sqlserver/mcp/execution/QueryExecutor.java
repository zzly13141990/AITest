package com.sqlserver.mcp.execution;

import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.model.query.ExecutionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.ResultSet;

public class QueryExecutor {
    private static final Logger log = LoggerFactory.getLogger(QueryExecutor.class);

    private final ConnectionPoolManager poolManager;
    private final PaginationRewriter rewriter;
    private final ResultCollector collector;
    private final QueryConfig queryConfig;

    public QueryExecutor(
        ConnectionPoolManager poolManager,
        PaginationRewriter rewriter,
        ResultCollector collector,
        QueryConfig queryConfig
    ) {
        this.poolManager = poolManager;
        this.rewriter = rewriter;
        this.collector = collector;
        this.queryConfig = queryConfig;
    }

    public ExecutionResult execute(String sql, String database, int page, int pageSize) {
        var effectivePageSize = Math.min(pageSize, queryConfig.maxPageSize());
        var rewritten = rewriter.rewrite(sql, page, effectivePageSize);

        log.debug("Executing query on database '{}': page={}, pageSize={}", database, page, effectivePageSize);

        // Execute count SQL to get total rows
        var totalRows = poolManager.withConnection(database, rewritten.countSql(), rs -> {
            rs.next();
            return rs.getInt(1);
        });

        // Execute paged SQL and collect results
        var data = poolManager.withConnection(database, rewritten.pageSql(), collector::collect);

        log.debug("Query completed: totalRows={}, returnedRows={}, truncated={}",
            totalRows, data.rows().size(), data.truncated());

        return new ExecutionResult(data, totalRows, rewritten.pageSql());
    }

    public ExecutionResult execute(String sql, String database) {
        return execute(sql, database, 1, queryConfig.defaultPageSize());
    }
}
