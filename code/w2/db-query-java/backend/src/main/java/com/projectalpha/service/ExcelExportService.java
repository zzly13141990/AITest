package com.projectalpha.service;

import com.projectalpha.constants.ApplicationConstants.Batch;
import com.projectalpha.constants.ApplicationConstants.ExcelExport;
import com.projectalpha.repository.ConnectionRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class ExcelExportService {
    private static final Logger logger = LoggerFactory.getLogger(ExcelExportService.class);

    private final ConnectionRepository connectionRepository;
    private final QueryExecutorService queryExecutorService;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");

    public ExcelExportService(ConnectionRepository connectionRepository, QueryExecutorService queryExecutorService) {
        this.connectionRepository = connectionRepository;
        this.queryExecutorService = queryExecutorService;
    }

    /**
     * Export query results to Excel file
     *
     * @param connectionId database connection ID
     * @param sql query SQL
     * @return Excel file as byte array
     * @throws Exception if export fails
     */
    public byte[] exportToExcel(long connectionId, String sql) throws Exception {
        com.projectalpha.entity.Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        String validatedSql = queryExecutorService.getSqlValidatorService().validateAndEnhanceSql(sql);

        try (java.sql.Connection conn = queryExecutorService.getConnection(connection);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(validatedSql)) {

            int estimatedRowCount = estimateRowCount(rs);
            Workbook workbook;
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            if (estimatedRowCount > ExcelExport.LARGE_DATA_THRESHOLD) {
                workbook = new SXSSFWorkbook(ExcelExport.SXSSF_WINDOW_SIZE);
                exportLargeDataSet((SXSSFWorkbook) workbook, rs, estimatedRowCount);
            } else {
                workbook = new XSSFWorkbook();
                exportSmallDataSet(workbook, rs);
            }

            workbook.write(outputStream);
            workbook.close();

            if (workbook instanceof SXSSFWorkbook) {
                ((SXSSFWorkbook) workbook).dispose();
            }

            return outputStream.toByteArray();
        }
    }

    /**
     * Estimate result set row count
     *
     * @param rs ResultSet to estimate
     * @return estimated row count
     * @throws SQLException if database access error occurs
     */
    private int estimateRowCount(ResultSet rs) throws SQLException {
        if (rs.getType() == ResultSet.TYPE_SCROLL_INSENSITIVE ||
            rs.getType() == ResultSet.TYPE_SCROLL_SENSITIVE) {
            try {
                rs.last();
                int count = rs.getRow();
                rs.beforeFirst();
                return count;
            } catch (SQLException e) {
                return ExcelExport.DEFAULT_ROW_COUNT_ESTIMATE;
            }
        }
        return ExcelExport.DEFAULT_ROW_COUNT_ESTIMATE;
    }

    /**
     * Export small dataset to XSSFWorkbook
     *
     * @param workbook XSSFWorkbook to write to
     * @param rs ResultSet to export
     * @throws SQLException if database access error occurs
     * @throws IOException if I/O error occurs
     */
    private void exportSmallDataSet(Workbook workbook, ResultSet rs) throws SQLException, IOException {
        Sheet sheet = workbook.createSheet("查询结果");
        CellStyle headerStyle = createHeaderStyle(workbook);

        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();

        // Create header row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < columnCount; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(metaData.getColumnLabel(i + 1));
            cell.setCellStyle(headerStyle);
        }

        // Fill data
        int rowNum = 1;
        while (rs.next()) {
            Row row = sheet.createRow(rowNum++);
            for (int i = 0; i < columnCount; i++) {
                setCellValue(row.createCell(i), rs.getObject(i + 1));
            }
        }

        // Auto-size columns
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    /**
     * Export large dataset to SXSSFWorkbook
     *
     * @param workbook SXSSFWorkbook to write to
     * @param rs ResultSet to export
     * @param estimatedRowCount estimated row count
     * @throws SQLException if database access error occurs
     * @throws IOException if I/O error occurs
     */
    private void exportLargeDataSet(SXSSFWorkbook workbook, ResultSet rs, int estimatedRowCount)
            throws SQLException, IOException {
        Sheet sheet = workbook.createSheet("查询结果");
        CellStyle headerStyle = createHeaderStyle(workbook);

        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();

        // Create header row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < columnCount; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(metaData.getColumnLabel(i + 1));
            cell.setCellStyle(headerStyle);
        }

        // Fill data with batching
        int rowNum = 1;
        int processedRows = 0;

        while (rs.next()) {
            Row row = sheet.createRow(rowNum++);
            for (int i = 0; i < columnCount; i++) {
                setCellValue(row.createCell(i), rs.getObject(i + 1));
            }

            // Batch flush and column auto-size
            if (processedRows % Batch.EXCEL_EXPORT_BATCH_SIZE == 0) {
                if (sheet instanceof SXSSFSheet) {
                    ((SXSSFSheet) sheet).flushRows();
                }
                for (int i = 0; i < Math.min(columnCount, ExcelExport.MAX_AUTO_SIZE_COLUMNS); i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            // Progress logging
            if (processedRows % ExcelExport.PROGRESS_LOG_INTERVAL == 0) {
                logger.info("Processed {} rows", processedRows);
            }
            processedRows++;
        }

        // Final column auto-size
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    /**
     * Set cell value based on data type
     *
     * @param cell cell to set value for
     * @param value value to set
     */
    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else if (value instanceof Date) {
            cell.setCellValue((Date) value);
        } else {
            cell.setCellValue(value.toString());
        }
    }

    /**
     * Create header cell style
     *
     * @param workbook workbook to create style from
     * @return header cell style
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 12);
        font.setBold(true);
        style.setFont(font);

        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);

        return style;
    }

    /**
     * Generate Excel file name
     *
     * @param sql SQL query to generate name from
     * @return generated file name
     */
    public String generateFileName(String sql) {
        String timestamp = dateFormat.format(new Date());
        String sanitizedSql = sql.replaceAll("[^a-zA-Z0-9一-龥]", "_");
        if (sanitizedSql.length() > ExcelExport.MAX_FILENAME_SQL_LENGTH) {
            sanitizedSql = sanitizedSql.substring(0, ExcelExport.MAX_FILENAME_SQL_LENGTH);
        }
        return "query_result_" + sanitizedSql + "_" + timestamp + ".xlsx";
    }
}
