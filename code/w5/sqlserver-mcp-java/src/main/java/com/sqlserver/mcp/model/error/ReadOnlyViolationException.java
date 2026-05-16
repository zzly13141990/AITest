package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class ReadOnlyViolationException extends McpException {
    public ReadOnlyViolationException(String detectedKeyword) {
        super("READ_ONLY_VIOLATION",
            "检测到写入操作 (" + detectedKeyword + ")，当前仅允许 SELECT 查询",
            "请修改为 SELECT 查询",
            Map.of("detectedKeyword", detectedKeyword));
    }
}
