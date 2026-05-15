package com.projectalpha.exception;

/**
 * Exception thrown when a database connection is not found
 */
public class ConnectionNotFoundException extends RuntimeException {

    private final Long connectionId;

    public ConnectionNotFoundException(Long connectionId) {
        super(String.format("Database connection not found with ID: %d", connectionId));
        this.connectionId = connectionId;
    }

    public ConnectionNotFoundException(String connectionName) {
        super(String.format("Database connection not found with name: %s", connectionName));
        this.connectionId = null;
    }

    public ConnectionNotFoundException(Long connectionId, Throwable cause) {
        super(String.format("Database connection not found with ID: %d", connectionId), cause);
        this.connectionId = connectionId;
    }

    public Long getConnectionId() {
        return connectionId;
    }
}
