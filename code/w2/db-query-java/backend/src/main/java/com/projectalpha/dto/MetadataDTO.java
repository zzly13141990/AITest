package com.projectalpha.dto;

import java.time.LocalDateTime;

public class MetadataDTO {
    private Long id;
    private Long connectionId;
    private String tableName;
    private String tableType;
    private String columns;
    private String uniqueKeys;
    private String checkConstraints;
    private String foreignKeys;
    private String indexes;
    private String tableReferences;
    private String primaryKeys;
    private String triggers;
    private String createBody;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getConnectionId() {
        return connectionId;
    }
    
    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }
    
    public String getTableName() {
        return tableName;
    }
    
    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
    
    public String getTableType() {
        return tableType;
    }
    
    public void setTableType(String tableType) {
        this.tableType = tableType;
    }
    
    public String getColumns() {
        return columns;
    }
    
    public void setColumns(String columns) {
        this.columns = columns;
    }
    
    public String getUniqueKeys() {
        return uniqueKeys;
    }
    
    public void setUniqueKeys(String uniqueKeys) {
        this.uniqueKeys = uniqueKeys;
    }
    
    public String getCheckConstraints() {
        return checkConstraints;
    }
    
    public void setCheckConstraints(String checkConstraints) {
        this.checkConstraints = checkConstraints;
    }
    
    public String getForeignKeys() {
        return foreignKeys;
    }
    
    public void setForeignKeys(String foreignKeys) {
        this.foreignKeys = foreignKeys;
    }
    
    public String getIndexes() {
        return indexes;
    }
    
    public void setIndexes(String indexes) {
        this.indexes = indexes;
    }
    
    public String getTableReferences() {
        return tableReferences;
    }
    
    public void setTableReferences(String tableReferences) {
        this.tableReferences = tableReferences;
    }
    
    public String getPrimaryKeys() {
        return primaryKeys;
    }
    
    public void setPrimaryKeys(String primaryKeys) {
        this.primaryKeys = primaryKeys;
    }
    
    public String getTriggers() {
        return triggers;
    }
    
    public void setTriggers(String triggers) {
        this.triggers = triggers;
    }
    
    public String getCreateBody() {
        return createBody;
    }
    
    public void setCreateBody(String createBody) {
        this.createBody = createBody;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}