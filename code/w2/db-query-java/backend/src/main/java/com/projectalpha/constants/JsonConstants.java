package com.projectalpha.constants;

/**
 * JSON response field name constants
 */
public final class JsonConstants {

    private JsonConstants() {}

    /**
     * Common response fields
     */
    public static final String ERROR = "error";
    public static final String MESSAGE = "message";
    public static final String TIMESTAMP = "timestamp";
    public static final String SUCCESS = "success";
    public static final String DATA = "data";

    /**
     * Query response fields
     */
    public static final class QueryResponse {
        public static final String TOTAL = "total";
        public static final String PAGE = "page";
        public static final String PAGE_SIZE = "pageSize";

        private QueryResponse() {}
    }

    /**
     * Database object fields
     */
    public static final class DatabaseObject {
        public static final String COLUMN_NAME = "columnName";
        public static final String DATA_TYPE = "dataType";
        public static final String COLUMN_SIZE = "columnSize";
        public static final String NULLABLE = "nullable";
        public static final String REMARKS = "remarks";
        public static final String INDEX_NAME = "indexName";
        public static final String ORDINAL = "ordinal";
        public static final String KEY_NAME = "keyName";
        public static final String KEY_SEQ = "keySeq";
        public static final String NON_UNIQUE = "nonUnique";
        public static final String TYPE = "type";
        public static final String FK_NAME = "fkName";
        public static final String FK_COLUMN = "fkColumn";
        public static final String PK_TABLE = "pkTable";
        public static final String PK_COLUMN = "pkColumn";
        public static final String FK_TABLE = "fkTable";
        public static final String TRIGGER_NAME = "triggerName";
        public static final String EVENT_MANIPULATION = "eventManipulation";
        public static final String ACTION_STATEMENT = "actionStatement";
        public static final String CONSTRAINT_NAME = "constraintName";
        public static final String CHECK_CLAUSE = "checkClause";

        private DatabaseObject() {}
    }

    /**
     * Metadata fields
     */
    public static final class Metadata {
        public static final String TABLE_NAME = "tableName";
        public static final String TABLE_TYPE = "tableType";
        public static final String COLUMNS = "columns";
        public static final String UNIQUE_KEYS = "uniqueKeys";
        public static final String CHECK_CONSTRAINTS = "checkConstraints";
        public static final String FOREIGN_KEYS = "foreignKeys";
        public static final String INDEXES = "indexes";
        public static final String TABLE_REFERENCES = "tableReferences";
        public static final String PRIMARY_KEYS = "primaryKeys";
        public static final String TRIGGERS = "triggers";
        public static final String CREATE_BODY = "createBody";
        public static final String CREATED_AT = "createdAt";
        public static final String UPDATED_AT = "updatedAt";

        private Metadata() {}
    }
}
