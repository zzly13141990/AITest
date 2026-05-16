package com.sqlserver.mcp.validation;

import java.util.Collections;
import java.util.Map;

public record ValidationResult(
    boolean passed,
    String errorCode,
    String message,
    String suggestion,
    Map<String, Object> details
) {
    public ValidationResult {
        details = details != null ? Collections.unmodifiableMap(details) : Map.of();
    }

    public static ValidationResult reject(String errorCode, String message, String suggestion, Map<String, Object> details) {
        return new ValidationResult(false, errorCode, message, suggestion, details);
    }
}
