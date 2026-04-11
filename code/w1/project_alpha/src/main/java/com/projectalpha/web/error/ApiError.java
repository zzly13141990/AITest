package com.projectalpha.web.error;

import java.util.List;

public record ApiError(
        int status,
        String error,
        String message,
        String path,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, path, null);
    }
}
