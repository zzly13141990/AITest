package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class QueryTimeoutException extends McpException {
    public QueryTimeoutException(long timeoutSeconds) {
        super("QUERY_TIMEOUT",
            "查询执行超时 (>" + timeoutSeconds + "s)",
            "请尝试简化查询或增加超时时间",
            Map.of("timeoutSeconds", timeoutSeconds));
    }
}
