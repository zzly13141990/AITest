package com.projectalpha.util;

import com.projectalpha.constants.DatabaseErrorMessages;
import com.projectalpha.exception.DatabaseException;

import java.sql.SQLException;

/**
 * Utility class for handling database errors
 */
public final class DatabaseErrorUtil {

    private DatabaseErrorUtil() {}

    /**
     * Convert SQLException to DatabaseException with enhanced error message
     *
     * @param e SQL exception
     * @param defaultMessage default error message
     * @return DatabaseException with enhanced message
     */
    public static DatabaseException convertToDatabaseException(SQLException e, String defaultMessage) {
        String enhancedMessage = buildEnhancedErrorMessage(e, defaultMessage);
        return new DatabaseException(enhancedMessage, e.getSQLState(), e.getErrorCode(), e);
    }

    /**
     * Build enhanced error message based on SQL state and error code
     *
     * @param e SQL exception
     * @param defaultMessage default error message
     * @return enhanced error message
     */
    public static String buildEnhancedErrorMessage(SQLException e, String defaultMessage) {
        StringBuilder errorMessage = new StringBuilder();
        errorMessage.append(defaultMessage != null ? defaultMessage : DatabaseErrorMessages.CONNECTION_FAILED);
        errorMessage.append(": ").append(e.getMessage());

        String msg = e.getMessage();
        if (msg != null) {
            if (msg.contains("Connection refused")) {
                errorMessage.append(" - ").append(DatabaseErrorMessages.CONNECTION_REFUSED);
            } else if (msg.contains("Login failed")) {
                errorMessage.append(" - ").append(DatabaseErrorMessages.LOGIN_FAILED);
            } else if (msg.contains("Timeout")) {
                errorMessage.append(" - ").append(DatabaseErrorMessages.CONNECTION_TIMEOUT);
            }
        }

        int errorCode = e.getErrorCode();
        String specificMessage = getSpecificErrorMessage(errorCode);
        if (specificMessage != null) {
            errorMessage.append(" - ").append(specificMessage);
        }

        return errorMessage.toString();
    }

    /**
     * Get specific error message for a given error code
     *
     * @param errorCode SQL error code
     * @return specific error message or null if no mapping exists
     */
    public static String getSpecificErrorMessage(int errorCode) {
        switch (errorCode) {
            case DatabaseErrorMessages.ErrorCodes.DUPLICATE_ENTRY:
                return DatabaseErrorMessages.ErrorCodes.DUPLICATE_ENTRY_MESSAGE;
            case DatabaseErrorMessages.ErrorCodes.TABLE_NOT_FOUND:
                return DatabaseErrorMessages.ErrorCodes.TABLE_NOT_FOUND_MESSAGE;
            case DatabaseErrorMessages.ErrorCodes.COLUMN_NOT_FOUND:
                return DatabaseErrorMessages.ErrorCodes.COLUMN_NOT_FOUND_MESSAGE;
            case DatabaseErrorMessages.ErrorCodes.SYNTAX_ERROR:
                return DatabaseErrorMessages.ErrorCodes.SYNTAX_ERROR_MESSAGE;
            default:
                return null;
        }
    }
}
