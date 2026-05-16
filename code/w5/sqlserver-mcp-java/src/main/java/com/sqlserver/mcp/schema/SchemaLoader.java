package com.sqlserver.mcp.schema;

import com.sqlserver.mcp.config.AppConfig.DatabaseConfig;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.model.schema.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.StructuredTaskScope;

public class SchemaLoader {
    private static final Logger log = LoggerFactory.getLogger(SchemaLoader.class);

    private final ConnectionPoolManager poolManager;
    private final DatabaseConfig config;

    public SchemaLoader(ConnectionPoolManager poolManager, DatabaseConfig config) {
        this.poolManager = poolManager;
        this.config = config;
    }

    public DatabaseSchema loadSchema(String databaseName) {
        log.info("Loading schema for database '{}'", databaseName);
        var start = System.nanoTime();

        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.awaitAllSuccessfulOrThrow())) {
            var tablesSubtask = scope.fork(() -> loadTables(databaseName));
            var columnsSubtask = scope.fork(() -> loadColumns(databaseName));
            var pksSubtask = scope.fork(() -> loadPrimaryKeys(databaseName));
            var fksSubtask = scope.fork(() -> loadForeignKeys(databaseName));
            var indexesSubtask = scope.fork(() -> loadIndexes(databaseName));
            var viewsSubtask = scope.fork(() -> loadViews(databaseName));

            scope.join();

            @SuppressWarnings("unchecked")
            var tables = (Map<String, String>) tablesSubtask.get();
            @SuppressWarnings("unchecked")
            var columnsMap = (Map<String, List<ColumnInfo>>) columnsSubtask.get();
            @SuppressWarnings("unchecked")
            var pksMap = (Map<String, List<String>>) pksSubtask.get();
            @SuppressWarnings("unchecked")
            var fksMap = (Map<String, List<ForeignKeyInfo>>) fksSubtask.get();
            @SuppressWarnings("unchecked")
            var indexesMap = (Map<String, List<IndexInfo>>) indexesSubtask.get();
            @SuppressWarnings("unchecked")
            var views = (Map<String, ViewInfo>) viewsSubtask.get();

            var tableInfos = assembleTables(tables, columnsMap, pksMap, fksMap, indexesMap);

            var elapsed = (System.nanoTime() - start) / 1_000_000;
            log.info("Schema for '{}' loaded in {}ms: {} tables, {} views",
                databaseName, elapsed, tableInfos.size(), views.size());

            return new DatabaseSchema(databaseName, tableInfos, views, List.of(), Instant.now());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Schema loading interrupted for '" + databaseName + "'", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load schema for '" + databaseName + "'", e);
        }
    }

    private Map<String, String> loadTables(String databaseName) throws SQLException {
        var tables = new HashMap<String, String>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT TABLE_SCHEMA, TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var schema = rs.getString("TABLE_SCHEMA");
                    var name = rs.getString("TABLE_NAME");
                    tables.put(qualify(schema, name), schema);
                }
            }
            return null;
        });
        return tables;
    }

    private Map<String, List<ColumnInfo>> loadColumns(String databaseName) throws SQLException {
        var columns = new HashMap<String, List<ColumnInfo>>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE,
                       IS_NULLABLE, COLUMN_DEFAULT, ORDINAL_POSITION,
                       CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var key = qualify(rs.getString("TABLE_SCHEMA"), rs.getString("TABLE_NAME"));
                    var col = new ColumnInfo(
                        rs.getString("COLUMN_NAME"),
                        rs.getString("DATA_TYPE"),
                        "YES".equalsIgnoreCase(rs.getString("IS_NULLABLE")),
                        rs.getString("COLUMN_DEFAULT"),
                        rs.getInt("ORDINAL_POSITION"),
                        rs.getObject("CHARACTER_MAXIMUM_LENGTH") != null
                            ? rs.getInt("CHARACTER_MAXIMUM_LENGTH") : null,
                        false, false, null, null
                    );
                    columns.computeIfAbsent(key, k -> new ArrayList<>()).add(col);
                }
            }
            return null;
        });
        return columns;
    }

    private Map<String, List<String>> loadPrimaryKeys(String databaseName) throws SQLException {
        var pks = new HashMap<String, List<String>>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                    ON tc.CONSTRAINT_CATALOG = kcu.CONSTRAINT_CATALOG
                    AND tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
                    AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ORDER BY kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.ORDINAL_POSITION
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var key = qualify(rs.getString("TABLE_SCHEMA"), rs.getString("TABLE_NAME"));
                    pks.computeIfAbsent(key, k -> new ArrayList<>()).add(rs.getString("COLUMN_NAME"));
                }
            }
            return null;
        });
        return pks;
    }

    private Map<String, List<ForeignKeyInfo>> loadForeignKeys(String databaseName) throws SQLException {
        var fks = new HashMap<String, List<ForeignKeyInfo>>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME,
                       ccu.TABLE_SCHEMA AS REF_SCHEMA, ccu.TABLE_NAME AS REF_TABLE,
                       ccu.COLUMN_NAME AS REF_COLUMN
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                    ON tc.CONSTRAINT_CATALOG = kcu.CONSTRAINT_CATALOG
                    AND tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
                    AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
                    ON tc.CONSTRAINT_CATALOG = ccu.CONSTRAINT_CATALOG
                    AND tc.CONSTRAINT_SCHEMA = ccu.CONSTRAINT_SCHEMA
                    AND tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
                ORDER BY kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.ORDINAL_POSITION
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var key = qualify(rs.getString("TABLE_SCHEMA"), rs.getString("TABLE_NAME"));
                    var fk = new ForeignKeyInfo(
                        rs.getString("COLUMN_NAME"),
                        rs.getString("REF_SCHEMA"),
                        rs.getString("REF_TABLE"),
                        rs.getString("REF_COLUMN")
                    );
                    fks.computeIfAbsent(key, k -> new ArrayList<>()).add(fk);
                }
            }
            return null;
        });
        return fks;
    }

    private Map<String, List<IndexInfo>> loadIndexes(String databaseName) throws SQLException {
        var indexes = new HashMap<String, List<IndexInfo>>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT s.name AS SCHEMA_NAME, t.name AS TABLE_NAME,
                       i.name AS INDEX_NAME, i.type AS INDEX_TYPE,
                       i.is_unique, c.name AS COLUMN_NAME
                FROM sys.indexes i
                JOIN sys.tables t ON i.object_id = t.object_id
                JOIN sys.schemas s ON t.schema_id = s.schema_id
                JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                WHERE i.type IN (1, 2) -- CLUSTERED and NONCLUSTERED
                ORDER BY s.name, t.name, i.name, ic.key_ordinal
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var key = qualify(rs.getString("SCHEMA_NAME"), rs.getString("TABLE_NAME"));
                    var indexName = rs.getString("INDEX_NAME");
                    if (indexName == null) continue; // skip heap (type 0)

                    var indexType = rs.getInt("INDEX_TYPE") == 1 ? "CLUSTERED" : "NONCLUSTERED";
                    var unique = rs.getBoolean("is_unique");
                    var colName = rs.getString("COLUMN_NAME");

                    var existing = indexes.get(key);
                    if (existing != null) {
                        var found = false;
                        for (var idx : existing) {
                            if (idx.name().equals(indexName)) {
                                // This record has the same index but a different column, so add column
                                var newColumns = new ArrayList<>(idx.columns());
                                newColumns.add(colName);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            existing.add(new IndexInfo(indexName, indexType, List.of(colName), unique));
                        }
                    } else {
                        var list = new ArrayList<IndexInfo>();
                        list.add(new IndexInfo(indexName, indexType, List.of(colName), unique));
                        indexes.put(key, list);
                    }
                }
            }
            return null;
        });
        return indexes;
    }

    private Map<String, ViewInfo> loadViews(String databaseName) throws SQLException {
        var views = new HashMap<String, ViewInfo>();
        poolManager.withConnection(databaseName, conn -> {
            var sql = """
                SELECT v.TABLE_SCHEMA, v.TABLE_NAME,
                       vc.COLUMN_NAME, vc.DATA_TYPE
                FROM INFORMATION_SCHEMA.VIEWS v
                LEFT JOIN INFORMATION_SCHEMA.VIEW_COLUMN_USAGE vcu
                    ON v.TABLE_CATALOG = vcu.VIEW_CATALOG
                    AND v.TABLE_SCHEMA = vcu.VIEW_SCHEMA
                    AND v.TABLE_NAME = vcu.VIEW_NAME
                LEFT JOIN INFORMATION_SCHEMA.COLUMNS vc
                    ON vcu.VIEW_CATALOG = vc.TABLE_CATALOG
                    AND vcu.VIEW_SCHEMA = vc.TABLE_SCHEMA
                    AND vcu.VIEW_NAME = vc.TABLE_NAME
                    AND vcu.COLUMN_NAME = vc.COLUMN_NAME
                ORDER BY v.TABLE_SCHEMA, v.TABLE_NAME, vc.ORDINAL_POSITION
                """;
            try (var stmt = conn.prepareStatement(sql);
                 var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    var key = qualify(rs.getString("TABLE_SCHEMA"), rs.getString("TABLE_NAME"));
                    var colName = rs.getString("COLUMN_NAME");
                    var dataType = rs.getString("DATA_TYPE");

                    var view = views.get(key);
                    if (view != null && colName != null) {
                        var existingCols = new ArrayList<>(view.columns());
                        existingCols.add(new ColumnInfo(colName, dataType, true, null, 0, null,
                            false, false, null, null));
                        views.put(key, new ViewInfo(view.name(), view.schema(), view.definition(),
                            existingCols));
                    } else if (colName != null) {
                        views.put(key, new ViewInfo(
                            rs.getString("TABLE_NAME"),
                            rs.getString("TABLE_SCHEMA"),
                            null,
                            List.of(new ColumnInfo(colName, dataType, true, null, 0, null,
                                false, false, null, null))
                        ));
                    } else {
                        views.putIfAbsent(key, new ViewInfo(
                            rs.getString("TABLE_NAME"),
                            rs.getString("TABLE_SCHEMA"),
                            null, List.of()
                        ));
                    }
                }
            }
            return null;
        });
        return views;
    }

    private Map<String, TableInfo> assembleTables(
            Map<String, String> tableSchemas,
            Map<String, List<ColumnInfo>> columnsMap,
            Map<String, List<String>> pksMap,
            Map<String, List<ForeignKeyInfo>> fksMap,
            Map<String, List<IndexInfo>> indexesMap) {

        var maxTables = config.schemaCacheMaxTables();
        var count = 0;
        var result = new LinkedHashMap<String, TableInfo>();

        for (var entry : tableSchemas.entrySet()) {
            if (count >= maxTables) {
                log.warn("Reached max table limit ({}), truncating schema", maxTables);
                break;
            }
            var qualifiedName = entry.getKey();
            var schemaName = entry.getValue();
            var simpleName = qualifiedName.contains(".")
                ? qualifiedName.substring(qualifiedName.indexOf('.') + 1)
                : qualifiedName;

            var cols = columnsMap.getOrDefault(qualifiedName, List.of());
            var pks = pksMap.getOrDefault(qualifiedName, List.of());

            // Mark PK columns in column info
            var pkSet = new HashSet<>(pks);
            var colsWithPk = cols.stream()
                .map(c -> new ColumnInfo(
                    c.name(), c.dataType(), c.nullable(), c.defaultValue(),
                    c.ordinalPosition(), c.maxLength(),
                    pkSet.contains(c.name()), c.foreignKey(),
                    c.foreignKeyRef(), c.comment()))
                .toList();

            // Mark FK columns in column info
            var fkList = fksMap.getOrDefault(qualifiedName, List.of());
            var fkColMap = new HashMap<String, String>();
            for (var fk : fkList) {
                fkColMap.put(fk.columnName(), fk.referencedSchema() + "." + fk.referencedTable() + "." + fk.referencedColumn());
            }
            var colsWithFk = colsWithPk.stream()
                .map(c -> fkColMap.containsKey(c.name())
                    ? new ColumnInfo(c.name(), c.dataType(), c.nullable(), c.defaultValue(),
                        c.ordinalPosition(), c.maxLength(), c.primaryKey(), true,
                        fkColMap.get(c.name()), c.comment())
                    : c)
                .toList();

            var table = new TableInfo(
                simpleName, schemaName, colsWithFk, pks, fkList,
                indexesMap.getOrDefault(qualifiedName, List.of()), null
            );
            result.put(simpleName, table);
            count++;
        }
        return result;
    }

    private static String qualify(String schema, String name) {
        return schema + "." + name;
    }
}
