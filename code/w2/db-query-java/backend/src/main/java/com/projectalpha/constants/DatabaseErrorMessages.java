package com.projectalpha.constants;

/**
 * Database error messages constants
 */
public final class DatabaseErrorMessages {

    private DatabaseErrorMessages() {}

    /**
     * Common error messages
     */
    public static final String CONNECTION_FAILED = "Database connection failed";
    public static final String CONNECTION_REFUSED = "Connection refused, please check if the database service is running and connection parameters are correct";
    public static final String LOGIN_FAILED = "Login failed, please check username and password";
    public static final String CONNECTION_TIMEOUT = "Connection timeout, please check network connection and database service status";

    /**
     * SQL error codes and messages
     */
    public static final class ErrorCodes {
        public static final int DUPLICATE_ENTRY = 1062;
        public static final int TABLE_NOT_FOUND = 1146;
        public static final int COLUMN_NOT_FOUND = 1054;
        public static final int SYNTAX_ERROR = 1064;

        public static final String DUPLICATE_ENTRY_MESSAGE = "Primary key or unique constraint violation";
        public static final String TABLE_NOT_FOUND_MESSAGE = "Table does not exist";
        public static final String COLUMN_NOT_FOUND_MESSAGE = "Column does not exist";
        public static final String SYNTAX_ERROR_MESSAGE = "SQL syntax error";

        private ErrorCodes() {}
    }

    /**
     * Error message templates
     */
    public static final class Templates {
        public static final String QUERY_FAILED = "Query execution failed: %s";
        public static final String UPDATE_FAILED = "Update execution failed: %s";
        public static final String CONNECTION_NOT_FOUND = "Connection not found with ID: %d";
        public static final String UNSUPPORTED_DATABASE_TYPE = "Unsupported database type: %s";

        private Templates() {}
    }
}
