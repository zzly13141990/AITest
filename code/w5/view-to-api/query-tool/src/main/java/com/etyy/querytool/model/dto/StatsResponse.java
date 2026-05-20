package com.etyy.querytool.model.dto;

public class StatsResponse {

    private long totalRequests;
    private long successCount;
    private long failCount;
    private long todayRequests;
    private double avgDurationMs;

    public StatsResponse() {}

    public StatsResponse(long totalRequests, long successCount, long failCount,
                         long todayRequests, double avgDurationMs) {
        this.totalRequests = totalRequests;
        this.successCount = successCount;
        this.failCount = failCount;
        this.todayRequests = todayRequests;
        this.avgDurationMs = avgDurationMs;
    }

    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
    public long getSuccessCount() { return successCount; }
    public void setSuccessCount(long successCount) { this.successCount = successCount; }
    public long getFailCount() { return failCount; }
    public void setFailCount(long failCount) { this.failCount = failCount; }
    public long getTodayRequests() { return todayRequests; }
    public void setTodayRequests(long todayRequests) { this.todayRequests = todayRequests; }
    public double getAvgDurationMs() { return avgDurationMs; }
    public void setAvgDurationMs(double avgDurationMs) { this.avgDurationMs = avgDurationMs; }
}
