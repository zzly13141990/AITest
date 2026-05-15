package com.projectalpha.util;

import com.projectalpha.constants.JsonConstants;

import java.util.List;
import java.util.Map;

/**
 * Utility class for building JSON strings
 * Used when external JSON libraries are not available or for simple JSON construction
 */
public final class JsonBuilder {

    private JsonBuilder() {}

    /**
     * Build a JSON array string from a list of maps
     *
     * @param items list of maps to convert to JSON array
     * @return JSON array string
     */
    public static String buildArray(List<Map<String, Object>> items) {
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> item = items.get(i);
            jsonBuilder.append(buildObject(item));
            if (i < items.size() - 1) {
                jsonBuilder.append(",");
            }
        }
        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }

    /**
     * Build a JSON object string from a map
     *
     * @param map map to convert to JSON object
     * @return JSON object string
     */
    public static String buildObject(Map<String, Object> map) {
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("{");
        int j = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            jsonBuilder.append("\"").append(entry.getKey()).append("\":");
            jsonBuilder.append(formatValue(entry.getValue()));
            if (j < map.size() - 1) {
                jsonBuilder.append(",");
            }
            j++;
        }
        jsonBuilder.append("}");
        return jsonBuilder.toString();
    }

    /**
     * Build a JSON array string from a list of maps with specific key constants
     *
     * @param items list of column metadata maps
     * @return JSON array string
     */
    public static String buildColumnsArray(List<Map<String, Object>> items) {
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> column = items.get(i);
            jsonBuilder.append("{");
            appendQuoted(jsonBuilder, JsonConstants.DatabaseObject.COLUMN_NAME, column.get(JsonConstants.DatabaseObject.COLUMN_NAME));
            jsonBuilder.append(",");
            appendQuoted(jsonBuilder, JsonConstants.DatabaseObject.DATA_TYPE, column.get(JsonConstants.DatabaseObject.DATA_TYPE));
            jsonBuilder.append(",");
            appendNumber(jsonBuilder, JsonConstants.DatabaseObject.COLUMN_SIZE, column.get(JsonConstants.DatabaseObject.COLUMN_SIZE));
            jsonBuilder.append(",");
            appendBoolean(jsonBuilder, JsonConstants.DatabaseObject.NULLABLE, column.get(JsonConstants.DatabaseObject.NULLABLE));
            jsonBuilder.append(",");
            appendQuoted(jsonBuilder, JsonConstants.DatabaseObject.REMARKS, column.get(JsonConstants.DatabaseObject.REMARKS));
            jsonBuilder.append("}");
            if (i < items.size() - 1) {
                jsonBuilder.append(",");
            }
        }
        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }

    /**
     * Build a JSON object string for pagination response
     *
     * @param total total count
     * @param page current page
     * @param pageSize page size
     * @param data data list
     * @return JSON object string
     */
    public static String buildPaginationResponse(int total, int page, int pageSize, String data) {
        return "{" +
            "\"" + JsonConstants.QueryResponse.TOTAL + "\":" + total + "," +
            "\"" + JsonConstants.QueryResponse.PAGE + "\":" + page + "," +
            "\"" + JsonConstants.QueryResponse.PAGE_SIZE + "\":" + pageSize + "," +
            "\"" + JsonConstants.DATA + "\":" + data +
            "}";
    }

    /**
     * Format a value for JSON output
     *
     * @param value value to format
     * @return formatted JSON string
     */
    private static String formatValue(Object value) {
        if (value == null) {
            return "null";
        } else if (value instanceof String) {
            return "\"" + escapeJsonString((String) value) + "\"";
        } else {
            return String.valueOf(value);
        }
    }

    /**
     * Escape special characters in JSON strings
     *
     * @param str string to escape
     * @return escaped string
     */
    private static String escapeJsonString(String str) {
        if (str == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (char c : str.toCharArray()) {
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Append a quoted field to JSON builder
     */
    private static void appendQuoted(StringBuilder builder, String key, Object value) {
        builder.append("\"").append(key).append("\":");
        builder.append(formatValue(value));
    }

    /**
     * Append a numeric field to JSON builder
     */
    private static void appendNumber(StringBuilder builder, String key, Object value) {
        builder.append("\"").append(key).append("\":");
        builder.append(value != null ? value : "null");
    }

    /**
     * Append a boolean field to JSON builder
     */
    private static void appendBoolean(StringBuilder builder, String key, Object value) {
        builder.append("\"").append(key).append("\":");
        builder.append(value != null ? value : "false");
    }
}
