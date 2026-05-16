package com.sqlserver.mcp.model.error;

import java.util.Map;

public sealed abstract class McpException extends RuntimeException
    permits InvalidInputException,
            ReadOnlyViolationException,
            SqlSyntaxException,
            SqlObjectNotFoundException,
            QueryTimeoutException,
            DbConnectionException,
            LlmApiException,
            LlmOutputParseException,
            SchemaNotFoundException,
            InternalException {

    private final String errorCode;
    private final String suggestion;
    private final Map<String, Object> details;

    protected McpException(String errorCode, String message, String suggestion, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.suggestion = suggestion;
        this.details = details != null ? Map.copyOf(details) : Map.of();
    }

    protected McpException(String errorCode, String message, String suggestion) {
        this(errorCode, message, suggestion, Map.of());
    }

    public String errorCode() { return errorCode; }
    public String suggestion() { return suggestion; }
    public Map<String, Object> details() { return details; }

    public boolean isRetryable() {
        return this instanceof LlmApiException
            || this instanceof DbConnectionException
            || this instanceof QueryTimeoutException;
    }
}
