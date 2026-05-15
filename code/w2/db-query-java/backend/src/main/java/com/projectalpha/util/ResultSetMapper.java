package com.projectalpha.util;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class for mapping ResultSet to Java objects
 */
public final class ResultSetMapper {

    private ResultSetMapper() {}

    /**
     * Convert ResultSet to List of Maps
     *
     * @param rs ResultSet to convert
     * @return List of maps representing rows
     * @throws SQLException if database access error occurs
     */
    public static List<Map<String, Object>> toList(ResultSet rs) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();

        while (rs.next()) {
            results.add(toRow(rs, metaData, columnCount));
        }

        return results;
    }

    /**
     * Convert a single row from ResultSet to Map
     *
     * @param rs ResultSet positioned at the desired row
     * @return Map representing the row
     * @throws SQLException if database access error occurs
     */
    public static Map<String, Object> toRow(ResultSet rs) throws SQLException {
        ResultSetMetaData metaData = rs.getMetaData();
        return toRow(rs, metaData, metaData.getColumnCount());
    }

    /**
     * Convert a single row from ResultSet to Map
     *
     * @param rs ResultSet positioned at the desired row
     * @param metaData ResultSet metadata
     * @param columnCount number of columns
     * @return Map representing the row
     * @throws SQLException if database access error occurs
     */
    private static Map<String, Object> toRow(ResultSet rs, ResultSetMetaData metaData, int columnCount)
            throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int i = 1; i <= columnCount; i++) {
            String columnName = metaData.getColumnName(i);
            Object value = rs.getObject(i);
            row.put(columnName, value);
        }
        return row;
    }

    /**
     * Extract a single value from ResultSet
     *
     * @param rs ResultSet positioned at the desired row
     * @param columnIndex column index (1-based)
     * @return the column value as an Object
     * @throws SQLException if database access error occurs
     */
    public static Object getValue(ResultSet rs, int columnIndex) throws SQLException {
        return rs.getObject(columnIndex);
    }

    /**
     * Extract a single value from ResultSet by column name
     *
     * @param rs ResultSet positioned at the desired row
     * @param columnName column name
     * @return the column value as an Object
     * @throws SQLException if database access error occurs
     */
    public static Object getValue(ResultSet rs, String columnName) throws SQLException {
        return rs.getObject(columnName);
    }
}
