package com.projectalpha.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "metadata")
public class Metadata {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "connection_id", nullable = false)
    private Connection connection;
    
    @Column(name = "table_name", length = 255, nullable = false)
    private String tableName;
    
    @Column(name = "table_type", length = 50, nullable = false)
    private String tableType;
    
    @Column(name = "columns", columnDefinition = "TEXT")
    private String columns;
    
    @Column(name = "unique_keys", columnDefinition = "TEXT")
    private String uniqueKeys;
    
    @Column(name = "check_constraints", columnDefinition = "TEXT")
    private String checkConstraints;
    
    @Column(name = "foreign_keys", columnDefinition = "TEXT")
    private String foreignKeys;
    
    @Column(name = "indexes", columnDefinition = "TEXT")
    private String indexes;
    
    @Column(name = "table_references", columnDefinition = "TEXT")
    private String tableReferences;
    
    @Column(name = "primary_keys", columnDefinition = "TEXT")
    private String primaryKeys;
    
    @Column(name = "triggers", columnDefinition = "TEXT")
    private String triggers;
    
    @Column(name = "create_body", columnDefinition = "TEXT")
    private String createBody;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Connection getConnection() {
        return connection;
    }
    
    public void setConnection(Connection connection) {
        this.connection = connection;
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