package com.projectalpha.constants;

/**
 * Application-wide constants
 */
public final class ApplicationConstants {

    private ApplicationConstants() {}

    /**
     * Pagination constants
     */
    public static final class Pagination {
        public static final int DEFAULT_PAGE = 1;
        public static final int DEFAULT_PAGE_SIZE = 20;
        public static final int MAX_PAGE_SIZE = 10000;
        public static final int EXPORT_DEFAULT_PAGE_SIZE = 10000;

        private Pagination() {}
    }

    /**
     * Batch processing constants
     */
    public static final class Batch {
        public static final int METADATA_EXTRACTION_BATCH_SIZE = 2000;
        public static final int EXCEL_EXPORT_BATCH_SIZE = 1000;

        private Batch() {}
    }

    /**
     * Excel export constants
     */
    public static final class ExcelExport {
        public static final int LARGE_DATA_THRESHOLD = 100000;
        public static final int SXSSF_WINDOW_SIZE = 100;
        public static final int DEFAULT_ROW_COUNT_ESTIMATE = 10000;
        public static final int PROGRESS_LOG_INTERVAL = 10000;
        public static final int MAX_AUTO_SIZE_COLUMNS = 10;
        public static final int MAX_FILENAME_SQL_LENGTH = 50;

        private ExcelExport() {}
    }

    /**
     * SQL constants
     */
    public static final class Sql {
        public static final String SELECT = "SELECT";
        public static final String INSERT = "INSERT";
        public static final String UPDATE = "UPDATE";
        public static final String DELETE = "DELETE";
        public static final String SELECT_ONE = "SELECT 1";

        private Sql() {}
    }

    /**
     * Object type constants
     */
    public static final class ObjectType {
        public static final String TABLE = "TABLE";
        public static final String VIEW = "VIEW";
        public static final String PROCEDURE = "PROC";
        public static final String FUNCTION = "FUNCTION";
        public static final String TRIGGER = "TRIGGER";

        private ObjectType() {}
    }
}
