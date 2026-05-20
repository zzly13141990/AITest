package com.etyy.querytool.model.entity;

import java.time.LocalDateTime;

public class QueryLog {

    private Long id;
    private LocalDateTime requestTime;
    private String clientIp;
    private String databaseIp;
    private int databasePort;
    private String databaseType;
    private String databaseName;
    private String sqlHash;
    private String sqlPreview;
    private String sqlFull;
    private String resultData;
    private String status;
    private String message;
    private int durationMs;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getRequestTime() { return requestTime; }
    public void setRequestTime(LocalDateTime requestTime) { this.requestTime = requestTime; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getDatabaseIp() { return databaseIp; }
    public void setDatabaseIp(String databaseIp) { this.databaseIp = databaseIp; }
    public int getDatabasePort() { return databasePort; }
    public void setDatabasePort(int databasePort) { this.databasePort = databasePort; }
    public String getDatabaseType() { return databaseType; }
    public void setDatabaseType(String databaseType) { this.databaseType = databaseType; }
    public String getDatabaseName() { return databaseName; }
    public void setDatabaseName(String databaseName) { this.databaseName = databaseName; }
    public String getSqlHash() { return sqlHash; }
    public void setSqlHash(String sqlHash) { this.sqlHash = sqlHash; }
    public String getSqlPreview() { return sqlPreview; }
    public void setSqlPreview(String sqlPreview) { this.sqlPreview = sqlPreview; }
    public String getSqlFull() { return sqlFull; }
    public void setSqlFull(String sqlFull) { this.sqlFull = sqlFull; }
    public String getResultData() { return resultData; }
    public void setResultData(String resultData) { this.resultData = resultData; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public int getDurationMs() { return durationMs; }
    public void setDurationMs(int durationMs) { this.durationMs = durationMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
