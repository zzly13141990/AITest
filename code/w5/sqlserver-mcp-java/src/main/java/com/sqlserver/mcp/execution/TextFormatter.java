package com.sqlserver.mcp.execution;

import java.util.List;

public class TextFormatter implements ResultFormatter {

    private static final int MAX_DISPLAY_ROWS = 100;

    @Override
    public String format(CollectResult data) {
        if (data.rows().isEmpty()) {
            return "（空结果集）";
        }

        var sb = new StringBuilder();

        // Header row
        sb.append("| ");
        for (int i = 0; i < data.columns().size(); i++) {
            if (i > 0) sb.append(" | ");
            sb.append(data.columns().get(i));
        }
        sb.append(" |\n");

        // Separator row
        sb.append("| ");
        for (int i = 0; i < data.columns().size(); i++) {
            if (i > 0) sb.append(" | ");
            sb.append("---");
        }
        sb.append(" |\n");

        // Data rows
        var displayRows = data.rows();
        boolean truncatedDisplay = false;
        if (displayRows.size() > MAX_DISPLAY_ROWS) {
            displayRows = displayRows.subList(0, MAX_DISPLAY_ROWS);
            truncatedDisplay = true;
        }

        for (var row : displayRows) {
            sb.append("| ");
            for (int i = 0; i < row.size(); i++) {
                if (i > 0) sb.append(" | ");
                sb.append(formatCell(row.get(i)));
            }
            sb.append(" |\n");
        }

        if (truncatedDisplay) {
            sb.append("\n*（结果集仅显示前 ")
                .append(MAX_DISPLAY_ROWS)
                .append(" 行，共 ")
                .append(data.rows().size())
                .append(" 行）*\n");
        }

        if (data.truncated()) {
            sb.append("\n*（结果集因大小限制被截断，总行数超过 ")
                .append(data.totalRows())
                .append("）*\n");
        }

        return sb.toString();
    }

    private static String formatCell(Object value) {
        if (value == null) return "NULL";
        if (value instanceof Double d) {
            if (d == d.longValue()) {
                return String.valueOf(d.longValue());
            }
            return String.valueOf(d);
        }
        if (value instanceof Float f) {
            if (f == f.longValue()) {
                return String.valueOf(f.longValue());
            }
            return String.valueOf(f);
        }
        return value.toString();
    }
}
