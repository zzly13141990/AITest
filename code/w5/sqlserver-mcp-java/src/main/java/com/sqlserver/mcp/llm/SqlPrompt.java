package com.sqlserver.mcp.llm;

public record SqlPrompt(String systemPrompt, String userPrompt) {
    public SqlPrompt {
        if (systemPrompt == null) throw new IllegalArgumentException("systemPrompt must not be null");
        if (userPrompt == null) throw new IllegalArgumentException("userPrompt must not be null");
    }
}
