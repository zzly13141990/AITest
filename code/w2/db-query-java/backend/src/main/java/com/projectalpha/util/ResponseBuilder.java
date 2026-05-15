package com.projectalpha.util;

import com.projectalpha.constants.JsonConstants;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Utility class for building API responses
 */
public final class ResponseBuilder {

    private ResponseBuilder() {}

    /**
     * Build a success response
     *
     * @param data data to include in response
     * @return success response map
     */
    public static Map<String, Object> success(Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, false);
        response.put(JsonConstants.SUCCESS, true);
        response.put(JsonConstants.DATA, data);
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build a success response with custom message
     *
     * @param message success message
     * @param data data to include in response
     * @return success response map
     */
    public static Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, false);
        response.put(JsonConstants.SUCCESS, true);
        response.put(JsonConstants.MESSAGE, message);
        response.put(JsonConstants.DATA, data);
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build an error response
     *
     * @param message error message
     * @return error response map
     */
    public static Map<String, Object> error(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, true);
        response.put(JsonConstants.SUCCESS, false);
        response.put(JsonConstants.MESSAGE, message);
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build an error response with exception details
     *
     * @param message error message
     * @param exception exception to include
     * @return error response map
     */
    public static Map<String, Object> error(String message, Throwable exception) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, true);
        response.put(JsonConstants.SUCCESS, false);
        response.put(JsonConstants.MESSAGE, message);
        if (exception != null) {
            response.put("exceptionType", exception.getClass().getSimpleName());
        }
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build a database error response
     *
     * @param sqlState SQL state
     * @param errorCode error code
     * @param message error message
     * @return error response map
     */
    public static Map<String, Object> databaseError(String sqlState, int errorCode, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, true);
        response.put(JsonConstants.SUCCESS, false);
        response.put(JsonConstants.MESSAGE, message);
        response.put("sqlState", sqlState);
        response.put("errorCode", errorCode);
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build a validation error response
     *
     * @param field field that failed validation
     * @param message error message
     * @return error response map
     */
    public static Map<String, Object> validationError(String field, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put(JsonConstants.ERROR, true);
        response.put(JsonConstants.SUCCESS, false);
        response.put(JsonConstants.MESSAGE, String.format("Validation failed for field '%s': %s", field, message));
        response.put("field", field);
        response.put(JsonConstants.TIMESTAMP, new Date());
        return response;
    }

    /**
     * Build a not found error response
     *
     * @param resource resource type
     * @param identifier resource identifier
     * @return error response map
     */
    public static Map<String, Object> notFound(String resource, String identifier) {
        return error(String.format("%s not found: %s", resource, identifier));
    }
}
