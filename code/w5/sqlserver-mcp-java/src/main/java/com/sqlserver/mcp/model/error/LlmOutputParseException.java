package com.sqlserver.mcp.model.error;

import java.util.Map;

public final class LlmOutputParseException extends McpException {
    public LlmOutputParseException(String rawOutput) {
        super("LLM_OUTPUT_PARSE_ERROR",
            "无法从 LLM 返回内容中提取有效 SQL 语句",
            "请尝试重新描述查询",
            Map.of("rawOutputSnippet",
                rawOutput.substring(0, Math.min(200, rawOutput.length()))));
    }
}
