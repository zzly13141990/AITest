package com.projectalpha.service;

import com.projectalpha.constants.ApplicationConstants;
import com.projectalpha.constants.ApplicationConstants.Batch;
import com.projectalpha.constants.ApplicationConstants.ObjectType;
import com.projectalpha.constants.JsonConstants;
import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.entity.Metadata;
import com.projectalpha.exception.ConnectionNotFoundException;
import com.projectalpha.exception.MetadataExtractionException;
import com.projectalpha.repository.ConnectionRepository;
import com.projectalpha.repository.MetadataRepository;
import com.projectalpha.util.DatabaseConnectionUtil;
import com.projectalpha.util.JsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for extracting and managing database metadata
 */
@Service
public class MetadataService {
    private static final Logger logger = LoggerFactory.getLogger(MetadataService.class);

    private final MetadataRepository metadataRepository;
    private final ConnectionRepository connectionRepository;

    public MetadataService(MetadataRepository metadataRepository, ConnectionRepository connectionRepository) {
        this.metadataRepository = metadataRepository;
        this.connectionRepository = connectionRepository;
    }

    @Transactional
    public void extractMetadata(Long connectionId) {
        logger.info("Starting metadata extraction for connection ID: {}", connectionId);
        com.projectalpha.entity.Connection connectionEntity = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException(connectionId));

        logger.info("Found connection: {}", connectionEntity.getConnectionName());

        // Clear old metadata
        logger.info("Clearing old metadata");
        metadataRepository.findByConnectionId(connectionId).forEach(metadataRepository::delete);

        // Extract new metadata
        try (java.sql.Connection conn = getConnection(connectionEntity)) {
            logger.info("Successfully established database connection");

            extractTablesInBatches(conn, connectionEntity);
            extractViewsInBatches(conn, connectionEntity);

            logger.info("Metadata extraction completed successfully");
        } catch (SQLException e) {
            logger.error("Failed to extract metadata", e);
            throw new MetadataExtractionException("Failed to extract metadata", e);
        }
    }

    public List<MetadataDTO> getMetadataByConnectionId(Long connectionId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        Page<Metadata> metadataPage = metadataRepository.findByConnectionId(connectionId, pageable);
        return metadataPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void extractTablesInBatches(java.sql.Connection conn, com.projectalpha.entity.Connection connectionEntity) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        List<String> tableNames = new ArrayList<>();
        String databaseName = connectionEntity.getDatabaseName();

        try (ResultSet tables = metaData.getTables(databaseName, null, "%", new String[]{ObjectType.TABLE})) {
            while (tables.next()) {
                tableNames.add(tables.getString("TABLE_NAME"));
            }
        }

        for (int i = 0; i < tableNames.size(); i += Batch.METADATA_EXTRACTION_BATCH_SIZE) {
            int end = Math.min(i + Batch.METADATA_EXTRACTION_BATCH_SIZE, tableNames.size());
            List<String> batchTableNames = tableNames.subList(i, end);
            logger.info("Processing tables batch: {}-{}/{}", i + 1, end, tableNames.size());

            for (String tableName : batchTableNames) {
                Metadata metadata = createMetadata(connectionEntity, tableName, ObjectType.TABLE);
                extractTableMetadata(conn, metadata, tableName);
                metadataRepository.save(metadata);
            }

            logger.info("Completed tables batch: {}-{}", i + 1, end);
        }
    }

    private void extractViewsInBatches(java.sql.Connection conn, com.projectalpha.entity.Connection connectionEntity) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        List<String> viewNames = new ArrayList<>();
        String databaseName = connectionEntity.getDatabaseName();

        try (ResultSet views = metaData.getTables(databaseName, null, "%", new String[]{ObjectType.VIEW})) {
            while (views.next()) {
                viewNames.add(views.getString("TABLE_NAME"));
            }
        }

        for (int i = 0; i < viewNames.size(); i += Batch.METADATA_EXTRACTION_BATCH_SIZE) {
            int end = Math.min(i + Batch.METADATA_EXTRACTION_BATCH_SIZE, viewNames.size());
            List<String> batchViewNames = viewNames.subList(i, end);
            logger.info("Processing views batch: {}-{}/{}", i + 1, end, viewNames.size());

            for (String viewName : batchViewNames) {
                Metadata metadata = createMetadata(connectionEntity, viewName, ObjectType.VIEW);
                extractViewMetadata(conn, metadata, viewName);
                metadataRepository.save(metadata);
            }

            logger.info("Completed views batch: {}-{}", i + 1, end);
        }
    }

    private Metadata createMetadata(com.projectalpha.entity.Connection connection, String name, String type) {
        Metadata metadata = new Metadata();
        metadata.setConnection(connection);
        metadata.setTableName(name);
        metadata.setTableType(type);
        return metadata;
    }

    private void extractTableMetadata(java.sql.Connection conn, Metadata metadata, String tableName) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        StringBuilder columns = new StringBuilder();
        StringBuilder primaryKeys = new StringBuilder();

        try (ResultSet rs = metaData.getColumns(null, null, tableName, null)) {
            while (rs.next()) {
                if (columns.length() > 0) columns.append(",");
                columns.append(rs.getString("COLUMN_NAME"));
            }
        }

        try (ResultSet rs = metaData.getPrimaryKeys(null, null, tableName)) {
            while (rs.next()) {
                if (primaryKeys.length() > 0) primaryKeys.append(",");
                primaryKeys.append(rs.getString("COLUMN_NAME"));
            }
        }

        metadata.setColumns(columns.toString());
        metadata.setPrimaryKeys(primaryKeys.toString());
    }

    private void extractViewMetadata(java.sql.Connection conn, Metadata metadata, String viewName) throws SQLException {
        // For views, we can also extract columns like tables
        DatabaseMetaData metaData = conn.getMetaData();
        StringBuilder columns = new StringBuilder();

        try (ResultSet rs = metaData.getColumns(null, null, viewName, null)) {
            while (rs.next()) {
                if (columns.length() > 0) columns.append(",");
                columns.append(rs.getString("COLUMN_NAME"));
            }
        }

        metadata.setColumns(columns.toString());
    }

    public Map<String, Integer> getMetadataCount(Long connectionId) {
        Map<String, Integer> countMap = new HashMap<>();
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return countMap;
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            String databaseName = connection.getDatabaseName();

            countMap.put(ObjectType.TABLE, countDatabaseObjects(metaData, databaseName, ObjectType.TABLE));
            countMap.put(ObjectType.VIEW, countDatabaseObjects(metaData, databaseName, ObjectType.VIEW));
            countMap.put(ObjectType.PROCEDURE, countDatabaseProceduresOrFunctions(metaData, databaseName, ObjectType.PROCEDURE));
            countMap.put(ObjectType.FUNCTION, countDatabaseProceduresOrFunctions(metaData, databaseName, ObjectType.FUNCTION));

            // Count triggers differently since it's database-specific
            countMap.put(ObjectType.TRIGGER, countTriggers(conn, databaseName, connection.getDatabaseType()));

        } catch (SQLException e) {
            logger.error("Failed to get metadata count", e);
        }

        return countMap;
    }

    private int countDatabaseObjects(DatabaseMetaData metaData, String databaseName, String objectType) throws SQLException {
        int count = 0;
        try (ResultSet rs = metaData.getTables(databaseName, null, "%", new String[]{objectType})) {
            while (rs.next()) {
                count++;
            }
        }
        return count;
    }

    private int countDatabaseProceduresOrFunctions(DatabaseMetaData metaData, String databaseName, String objectType) throws SQLException {
        int count = 0;
        String[] types = objectType.equals(ObjectType.PROCEDURE) ? new String[]{"PROCEDURE"} : new String[]{"FUNCTION"};
        try (ResultSet rs = metaData.getProcedures(databaseName, null, "%")) {
            while (rs.next()) {
                String procedureType = rs.getString("PROCEDURE_TYPE");
                if ((objectType.equals(ObjectType.PROCEDURE) && "1".equals(procedureType)) ||
                    (objectType.equals(ObjectType.FUNCTION) && "2".equals(procedureType))) {
                    count++;
                }
            }
        }
        return count;
    }

    private int countTriggers(java.sql.Connection conn, String databaseName, String databaseType) throws SQLException {
        int count = 0;
        String sql = "";

        switch (databaseType.toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ?";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                sql = "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE pg_table_is_visible(c.oid)";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                sql = "SELECT COUNT(*) FROM sys.triggers";
                break;
            default:
                return 0;
        }

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (databaseType.equalsIgnoreCase(DatabaseConnectionUtil.DATABASE_TYPE_MYSQL)) {
                stmt.setString(1, databaseName);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    count = rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            logger.warn("Failed to count triggers: {}", e.getMessage());
        }

        return count;
    }

    public List<String> getTables(Long connectionId, int page, int pageSize) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return new ArrayList<>();
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            return getDatabaseObjects(metaData, connection.getDatabaseName(), ObjectType.TABLE, page, pageSize);
        } catch (SQLException e) {
            logger.error("Failed to get tables", e);
        }

        return new ArrayList<>();
    }

    public List<String> getViews(Long connectionId, int page, int pageSize) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return new ArrayList<>();
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            return getDatabaseObjects(metaData, connection.getDatabaseName(), ObjectType.VIEW, page, pageSize);
        } catch (SQLException e) {
            logger.error("Failed to get views", e);
        }

        return new ArrayList<>();
    }

    public List<String> getProcedures(Long connectionId, int page, int pageSize) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return new ArrayList<>();
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            return getDatabaseProceduresOrFunctions(metaData, connection.getDatabaseName(), ObjectType.PROCEDURE, page, pageSize);
        } catch (SQLException e) {
            logger.error("Failed to get procedures", e);
        }

        return new ArrayList<>();
    }

    public List<String> getFunctions(Long connectionId, int page, int pageSize) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return new ArrayList<>();
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            return getDatabaseProceduresOrFunctions(metaData, connection.getDatabaseName(), ObjectType.FUNCTION, page, pageSize);
        } catch (SQLException e) {
            logger.error("Failed to get functions", e);
        }

        return new ArrayList<>();
    }

    public List<String> getTriggers(Long connectionId, int page, int pageSize) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return new ArrayList<>();
        }

        try (java.sql.Connection conn = getConnection(connection)) {
            return getTriggersForDatabase(conn, connection.getDatabaseName(), connection.getDatabaseType(), page, pageSize);
        } catch (SQLException e) {
            logger.error("Failed to get triggers", e);
        }

        return new ArrayList<>();
    }

    private List<String> getDatabaseObjects(DatabaseMetaData metaData, String databaseName, String objectType, int page, int pageSize) throws SQLException {
        List<String> objects = new ArrayList<>();
        
        try (ResultSet rs = metaData.getTables(databaseName, null, "%", new String[]{objectType})) {
            while (rs.next()) {
                objects.add(rs.getString("TABLE_NAME"));
            }
        }

        return paginateList(objects, page, pageSize);
    }

    private List<String> getDatabaseProceduresOrFunctions(DatabaseMetaData metaData, String databaseName, String objectType, int page, int pageSize) throws SQLException {
        List<String> objects = new ArrayList<>();
        String targetType = objectType.equals(ObjectType.PROCEDURE) ? "1" : "2";

        try (ResultSet rs = metaData.getProcedures(databaseName, null, "%")) {
            while (rs.next()) {
                String procedureType = rs.getString("PROCEDURE_TYPE");
                if (targetType.equals(procedureType)) {
                    objects.add(rs.getString("PROCEDURE_NAME"));
                }
            }
        }

        return paginateList(objects, page, pageSize);
    }

    private List<String> getTriggersForDatabase(java.sql.Connection conn, String databaseName, String databaseType, int page, int pageSize) throws SQLException {
        List<String> triggers = new ArrayList<>();
        String sql = "";

        switch (databaseType.toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                sql = "SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ?";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                sql = "SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE pg_table_is_visible(c.oid)";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                sql = "SELECT name FROM sys.triggers";
                break;
            default:
                return triggers;
        }

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                triggers.add(rs.getString(1));
            }
        }

        return paginateList(triggers, page, pageSize);
    }

    private List<String> paginateList(List<String> list, int page, int pageSize) {
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, list.size());
        
        if (start >= list.size()) {
            return new ArrayList<>();
        }

        return new ArrayList<>(list.subList(start, end));
    }

    public String getViewCreateBody(Long connectionId, String viewName) {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return null;
        }

        String sql = "";
        switch (connection.getDatabaseType().toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                sql = "SHOW CREATE VIEW `" + viewName + "`";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                sql = "SELECT pg_get_viewdef('" + viewName + "', true) as create_body";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                sql = "EXEC sp_helptext '" + viewName + "'";
                break;
            default:
                return null;
        }

        try (java.sql.Connection conn = getConnection(connection);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (rs.next()) {
                if (connection.getDatabaseType().equalsIgnoreCase(DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER)) {
                    // SQL Server 返回多行，需要拼接
                    StringBuilder sb = new StringBuilder();
                    do {
                        sb.append(rs.getString(1));
                    } while (rs.next());
                    return sb.toString();
                } else if (connection.getDatabaseType().equalsIgnoreCase(DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL)) {
                    return "CREATE VIEW " + viewName + " AS " + rs.getString(1);
                } else {
                    // MySQL: 尝试多种可能的列名
                    String result = rs.getString("Create View");
                    if (result == null) {
                        result = rs.getString("Create Table"); // MySQL可能返回这个列名
                    }
                    if (result == null) {
                        result = rs.getString(2); // 第二列通常是创建语句
                    }
                    return result;
                }
            }
        } catch (SQLException e) {
            logger.error("Failed to get view create body", e);
        }

        return null;
    }

    public Map<String, List<String>> searchObjects(Long connectionId, String keyword) {
        Map<String, List<String>> results = new HashMap<>();
        results.put(ObjectType.TABLE, new ArrayList<>());
        results.put(ObjectType.VIEW, new ArrayList<>());
        results.put(ObjectType.PROCEDURE, new ArrayList<>());
        results.put(ObjectType.FUNCTION, new ArrayList<>());
        
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection == null) {
            return results;
        }

        String lowerKeyword = keyword.toLowerCase();
        
        try (java.sql.Connection conn = getConnection(connection)) {
            DatabaseMetaData metaData = conn.getMetaData();
            String databaseName = connection.getDatabaseName();

            // Search tables
            searchObjectsByType(results, metaData, databaseName, ObjectType.TABLE, lowerKeyword);
            
            // Search views
            searchObjectsByType(results, metaData, databaseName, ObjectType.VIEW, lowerKeyword);
            
            // Search procedures
            searchProceduresOrFunctionsByType(results, metaData, databaseName, ObjectType.PROCEDURE, lowerKeyword);
            
            // Search functions
            searchProceduresOrFunctionsByType(results, metaData, databaseName, ObjectType.FUNCTION, lowerKeyword);

        } catch (SQLException e) {
            logger.error("Failed to search objects", e);
        }

        return results;
    }
    
    public Map<String, String> getViewDetails(Long connectionId, String viewName) {
        Map<String, String> details = new HashMap<>();
        String createBody = getViewCreateBody(connectionId, viewName);
        details.put("viewName", viewName);
        details.put("createBody", createBody != null ? createBody : "");
        return details;
    }
    
    public Map<String, String> getProcedureDetails(Long connectionId, String procedureName) {
        Map<String, String> details = new HashMap<>();
        details.put("name", procedureName);
        
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection != null) {
            String definition = getRoutineDefinition(connection, procedureName, true);
            details.put("createBody", definition);
        } else {
            details.put("createBody", "");
        }
        return details;
    }
    
    public Map<String, String> getFunctionDetails(Long connectionId, String functionName) {
        Map<String, String> details = new HashMap<>();
        details.put("name", functionName);
        
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection != null) {
            String definition = getRoutineDefinition(connection, functionName, false);
            details.put("createBody", definition);
        } else {
            details.put("createBody", "");
        }
        return details;
    }
    
    public Map<String, String> getTriggerDetails(Long connectionId, String triggerName) {
        Map<String, String> details = new HashMap<>();
        details.put("name", triggerName);
        
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId).orElse(null);
        if (connection != null) {
            String definition = getTriggerDefinition(connection, triggerName);
            details.put("createBody", definition);
        } else {
            details.put("createBody", "");
        }
        return details;
    }
    
    /**
     * 获取存储过程或函数的定义
     * @param connection 数据库连接实体
     * @param routineName 存储过程或函数名
     * @param isProcedure true为存储过程，false为函数
     * @return 定义语句
     */
    private String getRoutineDefinition(com.projectalpha.entity.Connection connection, String routineName, boolean isProcedure) {
        String sql = "";
        String type = isProcedure ? "PROCEDURE" : "FUNCTION";
        
        switch (connection.getDatabaseType().toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                sql = "SHOW CREATE " + type + " `" + routineName + "`";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                sql = "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = '" + routineName + "'";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                sql = "EXEC sp_helptext '" + routineName + "'";
                break;
            default:
                return "";
        }
        
        try (java.sql.Connection conn = getConnection(connection);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (connection.getDatabaseType().equalsIgnoreCase(DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER)) {
                // SQL Server 返回多行，需要拼接
                StringBuilder sb = new StringBuilder();
                while (rs.next()) {
                    sb.append(rs.getString(1));
                }
                return sb.toString();
            } else if (rs.next()) {
                // MySQL 返回的列名可能是 "Create Procedure" 或 "Create Function"
                String result = rs.getString("Create " + type);
                if (result == null) {
                    result = rs.getString(2); // 第二列通常是定义
                }
                return result;
            }
        } catch (SQLException e) {
            logger.error("Failed to get {} definition", type, e);
        }
        
        return "";
    }
    
    /**
     * 获取触发器的定义
     * @param connection 数据库连接实体
     * @param triggerName 触发器名
     * @return 定义语句
     */
    private String getTriggerDefinition(com.projectalpha.entity.Connection connection, String triggerName) {
        String sql = "";
        
        switch (connection.getDatabaseType().toLowerCase()) {
            case DatabaseConnectionUtil.DATABASE_TYPE_MYSQL:
                sql = "SHOW CREATE TRIGGER `" + triggerName + "`";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_POSTGRESQL:
                sql = "SELECT pg_get_triggerdef(t.oid) FROM pg_trigger t " +
                      "JOIN pg_class c ON t.tgrelid = c.oid " +
                      "WHERE t.tgname = '" + triggerName + "'";
                break;
            case DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER:
                sql = "EXEC sp_helptext '" + triggerName + "'";
                break;
            default:
                return "";
        }
        
        try (java.sql.Connection conn = getConnection(connection);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (connection.getDatabaseType().equalsIgnoreCase(DatabaseConnectionUtil.DATABASE_TYPE_SQLSERVER)) {
                // SQL Server 返回多行，需要拼接
                StringBuilder sb = new StringBuilder();
                while (rs.next()) {
                    sb.append(rs.getString(1));
                }
                return sb.toString();
            } else if (rs.next()) {
                // MySQL 返回的列名可能是 "SQL Original Statement" 或索引
                String result = rs.getString("SQL Original Statement");
                if (result == null) {
                    result = rs.getString(2); // 第二列通常是定义
                }
                return result;
            }
        } catch (SQLException e) {
            logger.error("Failed to get trigger definition", e);
        }
        
        return "";
    }

    private void searchObjectsByType(Map<String, List<String>> results, DatabaseMetaData metaData, 
                                     String databaseName, String objectType, String keyword) throws SQLException {
        try (ResultSet rs = metaData.getTables(databaseName, null, "%", new String[]{objectType})) {
            while (rs.next()) {
                String name = rs.getString("TABLE_NAME");
                if (name.toLowerCase().contains(keyword)) {
                    results.get(objectType).add(name);
                }
            }
        }
    }

    private void searchProceduresOrFunctionsByType(Map<String, List<String>> results, DatabaseMetaData metaData,
                                                   String databaseName, String objectType, String keyword) throws SQLException {
        String targetType = objectType.equals(ObjectType.PROCEDURE) ? "1" : "2";

        try (ResultSet rs = metaData.getProcedures(databaseName, null, "%")) {
            while (rs.next()) {
                String procedureType = rs.getString("PROCEDURE_TYPE");
                if (targetType.equals(procedureType)) {
                    String name = rs.getString("PROCEDURE_NAME");
                    if (name.toLowerCase().contains(keyword)) {
                        results.get(objectType).add(name);
                    }
                }
            }
        }
    }

    private java.sql.Connection getConnection(com.projectalpha.entity.Connection connection) throws SQLException {
        String url = DatabaseConnectionUtil.buildJdbcUrl(connection);
        return java.sql.DriverManager.getConnection(url, connection.getUsername(), connection.getPassword());
    }

    private MetadataDTO mapToDTO(Metadata metadata) {
        MetadataDTO dto = new MetadataDTO();
        dto.setId(metadata.getId());
        dto.setConnectionId(metadata.getConnection().getId());
        dto.setTableName(metadata.getTableName());
        dto.setTableType(metadata.getTableType());
        dto.setColumns(metadata.getColumns());
        dto.setPrimaryKeys(metadata.getPrimaryKeys());
        dto.setCreateBody(metadata.getCreateBody());
        return dto;
    }
}
