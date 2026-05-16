package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class InvalidInputException extends McpException {
    public InvalidInputException(String message) {
        super("INVALID_INPUT", message, "请检查输入参数", Map.of());
    }

    public InvalidInputException(String message, Map<String, Object> details) {
        super("INVALID_INPUT", message, "请检查输入参数", details);
    }
}
