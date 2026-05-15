package com.projectalpha.exception;

/**
 * Database exception for all database-related errors
 */
public class DatabaseException extends RuntimeException {

    private final String sqlState;
    private final int errorCode;

    public DatabaseException(String message) {
        super(message);
        this.sqlState = null;
        this.errorCode = 0;
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
        this.sqlState = cause instanceof java.sql.SQLException
            ? ((java.sql.SQLException) cause).getSQLState()
            : null;
        this.errorCode = cause instanceof java.sql.SQLException
            ? ((java.sql.SQLException) cause).getErrorCode()
            : 0;
    }

    public DatabaseException(String message, String sqlState, int errorCode) {
        super(message);
        this.sqlState = sqlState;
        this.errorCode = errorCode;
    }

    public DatabaseException(String message, String sqlState, int errorCode, Throwable cause) {
        super(message, cause);
        this.sqlState = sqlState;
        this.errorCode = errorCode;
    }

    public String getSqlState() {
        return sqlState;
    }

    public int getErrorCode() {
        return errorCode;
    }

    /**
     * Build a detailed error message with SQL state and error code
     */
    public String getDetailedMessage() {
        if (sqlState != null || errorCode != 0) {
            return String.format("%s (SQL State: %s, Error Code: %d)",
                getMessage(), sqlState, errorCode);
        }
        return getMessage();
    }
}
