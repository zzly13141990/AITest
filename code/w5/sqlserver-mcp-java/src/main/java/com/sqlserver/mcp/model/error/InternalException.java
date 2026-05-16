package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class InternalException extends McpException {
    public InternalException(String message) {
        super("INTERNAL_ERROR", message, "请稍后重试", Map.of());
    }

    public InternalException(String message, Throwable cause) {
        super("INTERNAL_ERROR", message + ": " + cause.getMessage(), "请稍后重试", Map.of());
    }
}
