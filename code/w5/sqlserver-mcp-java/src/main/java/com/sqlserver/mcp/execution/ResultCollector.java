package com.sqlserver.mcp.execution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class ResultCollector {
    private static final Logger log = LoggerFactory.getLogger(ResultCollector.class);

    private final int maxRows;
    private final int maxBytes;

    public ResultCollector(int maxRows, int maxBytes) {
        this.maxRows = maxRows > 0 ? maxRows : 100_000;
        this.maxBytes = maxBytes > 0 ? maxBytes : 52_428_800;
    }

    public CollectResult collect(ResultSet rs) throws SQLException {
        var meta = rs.getMetaData();
        var columnCount = meta.getColumnCount();
        var columnNames = new ArrayList<String>(columnCount);
        for (int i = 1; i <= columnCount; i++) {
            columnNames.add(meta.getColumnLabel(i));
        }

        rs.setFetchSize(1000);

        var rows = new ArrayList<List<Object>>();
        var totalRows = 0;
        long byteSize = 0;
        boolean truncated = false;

        while (rs.next()) {
            if (totalRows >= maxRows) {
                truncated = true;
                break;
            }

            var row = readRow(rs, columnCount);
            rows.add(row);
            totalRows++;

            byteSize += estimateRowBytes(row);
            if (byteSize > maxBytes) {
                truncated = true;
                break;
            }
        }

        log.debug("Collected {} rows (truncated: {}, byteSize: {})", totalRows, truncated, byteSize);
        return new CollectResult(columnNames, rows, totalRows, truncated, byteSize);
    }

    private List<Object> readRow(ResultSet rs, int columnCount) throws SQLException {
        var row = new ArrayList<>(columnCount);
        for (int i = 1; i <= columnCount; i++) {
            var value = rs.getObject(i);
            if (rs.wasNull()) {
                row.add(null);
            } else {
                row.add(convertValue(value));
            }
        }
        return row;
    }

    private static Object convertValue(Object value) {
        if (value == null) return null;
        // Handle common JDBC types for clean output
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (value instanceof java.sql.Time sqlTime) {
            return sqlTime.toLocalTime();
        }
        if (value instanceof java.sql.Timestamp sqlTs) {
            return sqlTs.toLocalDateTime();
        }
        if (value instanceof java.sql.Clob clob) {
            try {
                var len = (int) Math.min(clob.length(), 1024 * 1024);
                return clob.getSubString(1, len);
            } catch (SQLException e) {
                return "[clob]";
            }
        }
        if (value instanceof java.sql.Blob blob) {
            try {
                return "[blob " + blob.length() + " bytes]";
            } catch (SQLException e) {
                return "[blob]";
            }
        }
        if (value instanceof byte[]) {
            return "[binary " + ((byte[]) value).length + " bytes]";
        }
        return value;
    }

    private static long estimateRowBytes(List<Object> row) {
        long bytes = 0;
        for (var cell : row) {
            if (cell == null) {
                bytes += 4; // NULL marker
            } else if (cell instanceof String s) {
                bytes += s.length() * 2L; // approximate UTF-16
            } else if (cell instanceof Number n) {
                if (n instanceof Byte || n instanceof Short) bytes += 4;
                else if (n instanceof Integer) bytes += 4;
                else if (n instanceof Long) bytes += 8;
                else if (n instanceof Float) bytes += 4;
                else if (n instanceof Double) bytes += 8;
                else bytes += 16;
            } else if (cell instanceof Boolean) {
                bytes += 1;
            } else {
                bytes += 16;
            }
        }
        return bytes;
    }
}
