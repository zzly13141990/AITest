package com.projectalpha.exception;

/**
 * Exception thrown during metadata extraction operations
 */
public class MetadataExtractionException extends RuntimeException {

    private final String objectType;
    private final String objectName;

    public MetadataExtractionException(String message) {
        super(message);
        this.objectType = null;
        this.objectName = null;
    }

    public MetadataExtractionException(String message, Throwable cause) {
        super(message, cause);
        this.objectType = null;
        this.objectName = null;
    }

    public MetadataExtractionException(String objectType, String objectName, String message) {
        super(String.format("Failed to extract %s '%s': %s", objectType, objectName, message));
        this.objectType = objectType;
        this.objectName = objectName;
    }

    public MetadataExtractionException(String objectType, String objectName, String message, Throwable cause) {
        super(String.format("Failed to extract %s '%s': %s", objectType, objectName, message), cause);
        this.objectType = objectType;
        this.objectName = objectName;
    }

    public String getObjectType() {
        return objectType;
    }

    public String getObjectName() {
        return objectName;
    }
}
