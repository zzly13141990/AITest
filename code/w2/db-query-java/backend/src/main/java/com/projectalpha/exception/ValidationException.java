package com.projectalpha.exception;

/**
 * Exception thrown when input validation fails
 */
public class ValidationException extends RuntimeException {

    private final String field;
    private final Object value;

    public ValidationException(String message) {
        super(message);
        this.field = null;
        this.value = null;
    }

    public ValidationException(String field, String message) {
        super(String.format("Validation failed for field '%s': %s", field, message));
        this.field = field;
        this.value = null;
    }

    public ValidationException(String field, Object value, String message) {
        super(String.format("Validation failed for field '%s' with value '%s': %s",
            field, value, message));
        this.field = field;
        this.value = value;
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
        this.field = null;
        this.value = null;
    }

    public String getField() {
        return field;
    }

    public Object getValue() {
        return value;
    }
}
