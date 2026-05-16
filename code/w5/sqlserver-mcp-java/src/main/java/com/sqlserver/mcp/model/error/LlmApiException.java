package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class LlmApiException extends McpException {
    public LlmApiException(String message) {
        super("LLM_API_ERROR", message, "请检查 LLM 服务配置和 API Key", Map.of());
    }

    public LlmApiException(String message, Throwable cause) {
        super("LLM_API_ERROR",
            message + ": " + cause.getMessage(),
            "请检查 LLM 服务配置和 API Key",
            Map.of());
    }
}
