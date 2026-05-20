package com.etyy.querytool.model.dto;

public class ApiResponse<T> {

    private String status;
    private String message;
    private T data;
    private Object metadata;

    public ApiResponse() {}

    public ApiResponse(String status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(String status, String message, T data, Object metadata) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.metadata = metadata;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", "操作成功", data);
    }

    public static <T> ApiResponse<T> success(T data, Object metadata) {
        return new ApiResponse<>("success", "操作成功", data, metadata);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>("fail", message, null);
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public Object getMetadata() { return metadata; }
    public void setMetadata(Object metadata) { this.metadata = metadata; }
}
