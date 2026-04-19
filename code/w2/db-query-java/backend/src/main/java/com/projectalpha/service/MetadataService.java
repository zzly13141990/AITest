package com.projectalpha.service;

import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.entity.Connection;
import com.projectalpha.entity.Metadata;
import com.projectalpha.repository.ConnectionRepository;
import com.projectalpha.repository.MetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MetadataService {
    private final MetadataRepository metadataRepository;
    private final ConnectionRepository connectionRepository;
    
    public MetadataService(MetadataRepository metadataRepository, ConnectionRepository connectionRepository) {
        this.metadataRepository = metadataRepository;
        this.connectionRepository = connectionRepository;
    }
    
    @Transactional
    public void extractMetadata(Long connectionId) {
        System.out.println("开始提取元数据，连接ID: " + connectionId);
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
        
        System.out.println("找到连接: " + connection.getConnectionName());
        
        // 清除旧的元数据
        System.out.println("清除旧的元数据");
        metadataRepository.findByConnectionId(connectionId).forEach(metadataRepository::delete);
        
        // 提取新的元数据
        try (java.sql.Connection conn = getConnection(connection)) {
            System.out.println("成功建立数据库连接");
            // 提取表信息
            System.out.println("开始提取表信息");
            extractTables(conn, connection);
            
            // 提取视图信息
            System.out.println("开始提取视图信息");
            extractViews(conn, connection);
            
            // 提取存储过程信息
            System.out.println("开始提取存储过程信息");
            extractProcedures(conn, connection);
            
            // 提取函数信息
            System.out.println("开始提取函数信息");
            extractFunctions(conn, connection);
            
            System.out.println("元数据提取完成");
        } catch (SQLException e) {
            System.err.println("提取元数据失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to extract metadata", e);
        }
    }
    
    public List<MetadataDTO> getMetadataByConnectionId(Long connectionId) {
        return metadataRepository.findByConnectionId(connectionId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    private void extractTables(java.sql.Connection conn, Connection connection) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet tables = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
            while (tables.next()) {
                String tableName = tables.getString("TABLE_NAME");
                Metadata metadata = new Metadata();
                metadata.setConnection(connection);
                metadata.setTableName(tableName);
                metadata.setTableType("TABLE");
                metadata.setColumns(extractColumns(conn, tableName));
                metadata.setUniqueKeys(extractUniqueKeys(conn, tableName));
                metadata.setCheckConstraints(extractCheckConstraints(conn, tableName));
                metadata.setForeignKeys(extractForeignKeys(conn, tableName));
                metadata.setIndexes(extractIndexes(conn, tableName));
                metadata.setTableReferences(extractReferences(conn, tableName));
                metadata.setPrimaryKeys(extractPrimaryKeys(conn, tableName));
                metadata.setTriggers(extractTriggers(conn, tableName));
                metadataRepository.save(metadata);
            }
        }
    }
    
    private void extractViews(java.sql.Connection conn, Connection connection) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet views = metaData.getTables(null, null, "%", new String[]{"VIEW"})) {
            while (views.next()) {
                String viewName = views.getString("TABLE_NAME");
                Metadata metadata = new Metadata();
                metadata.setConnection(connection);
                metadata.setTableName(viewName);
                metadata.setTableType("VIEW");
                metadata.setColumns(extractColumns(conn, viewName));
                metadataRepository.save(metadata);
            }
        }
    }
    
    private void extractProcedures(java.sql.Connection conn, Connection connection) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet procedures = metaData.getProcedures(null, null, "%")) {
            while (procedures.next()) {
                String procedureName = procedures.getString("PROCEDURE_NAME");
                Metadata metadata = new Metadata();
                metadata.setConnection(connection);
                metadata.setTableName(procedureName);
                metadata.setTableType("PROC");
                metadata.setColumns("[]"); // 存储过程没有列信息
                metadataRepository.save(metadata);
            }
        }
    }
    
    private void extractFunctions(java.sql.Connection conn, Connection connection) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet functions = metaData.getFunctions(null, null, "%")) {
            while (functions.next()) {
                String functionName = functions.getString("FUNCTION_NAME");
                Metadata metadata = new Metadata();
                metadata.setConnection(connection);
                metadata.setTableName(functionName);
                metadata.setTableType("FUNCTION");
                metadata.setColumns("[]"); // 函数没有列信息
                metadataRepository.save(metadata);
            }
        }
    }
    
    private String extractColumns(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> columns = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet columnsRs = metaData.getColumns(null, null, tableName, "%")) {
            while (columnsRs.next()) {
                Map<String, Object> column = new HashMap<>();
                column.put("columnName", columnsRs.getString("COLUMN_NAME"));
                column.put("dataType", columnsRs.getString("TYPE_NAME"));
                column.put("columnSize", columnsRs.getInt("COLUMN_SIZE"));
                column.put("nullable", columnsRs.getInt("NULLABLE") == 1);
                column.put("remarks", columnsRs.getString("REMARKS"));
                columns.add(column);
            }
        }
        
        return buildJsonString(columns);
    }
    
    private String extractUniqueKeys(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> keys = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet keysRs = metaData.getIndexInfo(null, null, tableName, true, false)) {
            while (keysRs.next()) {
                Map<String, Object> key = new HashMap<>();
                key.put("indexName", keysRs.getString("INDEX_NAME"));
                key.put("columnName", keysRs.getString("COLUMN_NAME"));
                key.put("ordinal", keysRs.getShort("ORDINAL_POSITION"));
                keys.add(key);
            }
        }
        
        return buildJsonString(keys);
    }
    
    private String extractCheckConstraints(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> constraints = new ArrayList<>();
        String sql = "SELECT CONSTRAINT_NAME, CHECK_CLAUSE FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc " +
                     "JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME " +
                     "WHERE tc.TABLE_NAME = ? AND tc.CONSTRAINT_TYPE = 'CHECK'";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tableName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> constraint = new HashMap<>();
                    constraint.put("constraintName", rs.getString("CONSTRAINT_NAME"));
                    constraint.put("checkClause", rs.getString("CHECK_CLAUSE"));
                    constraints.add(constraint);
                }
            }
        } catch (SQLException e) {
            System.out.println("Check constraints extraction not supported: " + e.getMessage());
        }
        
        return buildJsonString(constraints);
    }
    
    private String extractForeignKeys(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> keys = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet keysRs = metaData.getImportedKeys(null, null, tableName)) {
            while (keysRs.next()) {
                Map<String, Object> key = new HashMap<>();
                key.put("fkName", keysRs.getString("FK_NAME"));
                key.put("fkColumn", keysRs.getString("FKCOLUMN_NAME"));
                key.put("pkTable", keysRs.getString("PKTABLE_NAME"));
                key.put("pkColumn", keysRs.getString("PKCOLUMN_NAME"));
                keys.add(key);
            }
        }
        
        return buildJsonString(keys);
    }
    
    private String extractIndexes(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> indexes = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet indexesRs = metaData.getIndexInfo(null, null, tableName, false, false)) {
            while (indexesRs.next()) {
                Map<String, Object> index = new HashMap<>();
                index.put("indexName", indexesRs.getString("INDEX_NAME"));
                index.put("columnName", indexesRs.getString("COLUMN_NAME"));
                index.put("nonUnique", indexesRs.getBoolean("NON_UNIQUE"));
                index.put("type", indexesRs.getShort("TYPE"));
                indexes.add(index);
            }
        }
        
        return buildJsonString(indexes);
    }
    
    private String extractReferences(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> refs = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet refsRs = metaData.getExportedKeys(null, null, tableName)) {
            while (refsRs.next()) {
                Map<String, Object> ref = new HashMap<>();
                ref.put("fkName", refsRs.getString("FK_NAME"));
                ref.put("fkTable", refsRs.getString("FKTABLE_NAME"));
                ref.put("fkColumn", refsRs.getString("FKCOLUMN_NAME"));
                ref.put("pkColumn", refsRs.getString("PKCOLUMN_NAME"));
                refs.add(ref);
            }
        }
        
        return buildJsonString(refs);
    }
    
    private String extractTriggers(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> triggers = new ArrayList<>();
        try {
            String sql = "SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_STATEMENT FROM INFORMATION_SCHEMA.TRIGGERS WHERE EVENT_OBJECT_TABLE = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, tableName);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> trigger = new HashMap<>();
                        trigger.put("triggerName", rs.getString("TRIGGER_NAME"));
                        trigger.put("eventManipulation", rs.getString("EVENT_MANIPULATION"));
                        trigger.put("actionStatement", rs.getString("ACTION_STATEMENT"));
                        triggers.add(trigger);
                    }
                }
            }
        } catch (SQLException e) {
            System.out.println("Triggers extraction not supported for " + tableName + ": " + e.getMessage());
        }
        
        return buildJsonString(triggers);
    }
    
    private String extractPrimaryKeys(java.sql.Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> primaryKeys = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet keysRs = metaData.getPrimaryKeys(null, null, tableName)) {
            while (keysRs.next()) {
                Map<String, Object> key = new HashMap<>();
                key.put("columnName", keysRs.getString("COLUMN_NAME"));
                key.put("keySeq", keysRs.getShort("KEY_SEQ"));
                key.put("pkName", keysRs.getString("PK_NAME"));
                primaryKeys.add(key);
            }
        }
        
        return buildJsonString(primaryKeys);
    }
    
    private String buildJsonString(List<Map<String, Object>> columns) {
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");
        for (int i = 0; i < columns.size(); i++) {
            Map<String, Object> column = columns.get(i);
            jsonBuilder.append("{");
            int j = 0;
            for (Map.Entry<String, Object> entry : column.entrySet()) {
                jsonBuilder.append("\"").append(entry.getKey()).append("\":");
                Object value = entry.getValue();
                if (value == null) {
                    jsonBuilder.append("null");
                } else if (value instanceof String) {
                    jsonBuilder.append("\"").append(value).append("\"");
                } else {
                    jsonBuilder.append(value);
                }
                if (j < column.size() - 1) {
                    jsonBuilder.append(",");
                }
                j++;
            }
            jsonBuilder.append("}");
            if (i < columns.size() - 1) {
                jsonBuilder.append(",");
            }
        }
        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private java.sql.Connection getConnection(Connection connection) throws SQLException {
        String url = getConnectionUrl(connection);
        return DriverManager.getConnection(url, connection.getUsername(), connection.getPassword());
    }
    
    private String getConnectionUrl(Connection connection) {
        switch (connection.getDatabaseType().toLowerCase()) {
            case "mysql":
                return "jdbc:mysql://" + connection.getHost() + ":" + connection.getPort() + "/" + connection.getDatabaseName() + "?useSSL=false&serverTimezone=UTC";
            case "postgresql":
                return "jdbc:postgresql://" + connection.getHost() + ":" + connection.getPort() + "/" + connection.getDatabaseName() + "?sslmode=disable";
            case "sqlserver":
                return "jdbc:sqlserver://" + connection.getHost() + ":" + connection.getPort() + ";databaseName=" + connection.getDatabaseName() + ";encrypt=false;trustServerCertificate=true";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + connection.getDatabaseType());
        }
    }
    
    private MetadataDTO mapToDTO(Metadata metadata) {
        MetadataDTO metadataDTO = new MetadataDTO();
        metadataDTO.setId(metadata.getId());
        metadataDTO.setConnectionId(metadata.getConnection().getId());
        metadataDTO.setTableName(metadata.getTableName());
        metadataDTO.setTableType(metadata.getTableType());
        metadataDTO.setColumns(metadata.getColumns());
        metadataDTO.setUniqueKeys(metadata.getUniqueKeys());
        metadataDTO.setCheckConstraints(metadata.getCheckConstraints());
        metadataDTO.setForeignKeys(metadata.getForeignKeys());
        metadataDTO.setIndexes(metadata.getIndexes());
        metadataDTO.setTableReferences(metadata.getTableReferences());
        metadataDTO.setPrimaryKeys(metadata.getPrimaryKeys());
        metadataDTO.setTriggers(metadata.getTriggers());
        metadataDTO.setCreatedAt(metadata.getCreatedAt());
        metadataDTO.setUpdatedAt(metadata.getUpdatedAt());
        return metadataDTO;
    }
}