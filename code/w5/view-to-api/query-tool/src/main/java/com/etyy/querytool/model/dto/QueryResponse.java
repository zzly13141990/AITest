package com.etyy.querytool.model.dto;

import java.util.List;
import java.util.Map;

public class QueryResponse {

    private String status;
    private String executionTime;
    private String message;
    private long durationMs;
    private List<Map<String, Object>> data;
    private Map<String, Object> metadata;

    public QueryResponse() {}

    public QueryResponse(String status, String executionTime, String message,
                         long durationMs, List<Map<String, Object>> data,
                         Map<String, Object> metadata) {
        this.status = status;
        this.executionTime = executionTime;
        this.message = message;
        this.durationMs = durationMs;
        this.data = data;
        this.metadata = metadata;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getExecutionTime() { return executionTime; }
    public void setExecutionTime(String executionTime) { this.executionTime = executionTime; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public List<Map<String, Object>> getData() { return data; }
    public void setData(List<Map<String, Object>> data) { this.data = data; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
