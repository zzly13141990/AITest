package com.sqlserver.mcp.model.query;

import com.sqlserver.mcp.model.error.McpException;
import com.sqlserver.mcp.util.JsonUtils;
import io.modelcontextprotocol.spec.McpSchema;
import org.jspecify.annotations.Nullable;
import java.util.Map;

public sealed interface QueryResponse {
    McpSchema.CallToolResult toCallToolResult();

    record Success(
        String text,
        Meta meta
    ) implements QueryResponse {
        public McpSchema.CallToolResult toCallToolResult() {
            return McpSchema.CallToolResult.builder()
                .addTextContent(text)
                .build();
        }
    }

    record SqlOnly(
        String sql
    ) implements QueryResponse {
        public McpSchema.CallToolResult toCallToolResult() {
            return McpSchema.CallToolResult.builder()
                .addTextContent(sql)
                .build();
        }
    }

    record Error(
        String errorCode,
        String message,
        @Nullable String suggestion,
        Map<String, Object> details
    ) implements QueryResponse {
        public McpSchema.CallToolResult toCallToolResult() {
            var errorJson = JsonUtils.toJson(Map.of(
                "errorCode", errorCode,
                "message", message,
                "suggestion", suggestion != null ? suggestion : "",
                "details", details != null ? details : Map.of()
            ));
            return McpSchema.CallToolResult.builder()
                .addTextContent(errorJson)
                .isError(true)
                .build();
        }
    }

    record Meta(
        String database,
        String mode,
        String sql,
        int rowCount,
        int totalRows,
        int page,
        int pageSize,
        double verificationScore,
        boolean verificationPassed,
        long executionTimeMs
    ) {}

    static Error error(McpException e) {
        return new Error(e.errorCode(), e.getMessage(), e.suggestion(), e.details());
    }
}
