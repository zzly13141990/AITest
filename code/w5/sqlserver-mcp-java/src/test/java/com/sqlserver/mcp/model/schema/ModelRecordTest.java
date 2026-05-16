package com.sqlserver.mcp.model.schema;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class ModelRecordTest {

    @Test
    void databaseSchema_shouldDefaultCachedAt() {
        var schema = new DatabaseSchema("test", Map.of(), Map.of(), List.of(), null);
        assertNotNull(schema.cachedAt());
    }

    @Test
    void databaseSchema_shouldProvideUnmodifiableMaps() {
        var schema = new DatabaseSchema("test", null, null, null, Instant.now());
        assertThrows(UnsupportedOperationException.class, () -> schema.tables().put("x", null));
        assertThrows(UnsupportedOperationException.class, () -> schema.views().put("x", null));
    }

    @Test
    void tableInfo_shouldDefaultSchema() {
        var table = new TableInfo("users", null, List.of(), List.of(), List.of(), List.of(), null);
        assertEquals("dbo", table.schema());
    }

    @Test
    void tableInfo_shouldProvideUnmodifiableLists() {
        var table = new TableInfo("users", "dbo", null, null, null, null, null);
        assertThrows(UnsupportedOperationException.class, () -> table.columns().add(null));
        assertThrows(UnsupportedOperationException.class, () -> table.primaryKeys().add("x"));
    }

    @Test
    void columnInfo_shouldStoreAllFields() {
        var col = new ColumnInfo("id", "INT", false, "NEXT VALUE FOR seq", 1, null, true, false, null, "主键");
        assertEquals("id", col.name());
        assertEquals("INT", col.dataType());
        assertFalse(col.nullable());
        assertEquals("NEXT VALUE FOR seq", col.defaultValue());
        assertEquals(1, col.ordinalPosition());
        assertNull(col.maxLength());
        assertTrue(col.primaryKey());
        assertFalse(col.foreignKey());
        assertNull(col.foreignKeyRef());
        assertEquals("主键", col.comment());
    }

    @Test
    void viewInfo_shouldDefaultSchema() {
        var view = new ViewInfo("v_users", null, "SELECT * FROM users", null);
        assertEquals("dbo", view.schema());
        assertTrue(view.columns().isEmpty());
    }

    @Test
    void indexInfo_shouldDefaultColumns() {
        var idx = new IndexInfo("idx_name", "NONCLUSTERED", null, false);
        assertTrue(idx.columns().isEmpty());
    }

    @Test
    void foreignKeyInfo_shouldDefaultSchema() {
        var fk = new ForeignKeyInfo("dept_id", null, "departments", "id");
        assertEquals("dbo", fk.referencedSchema());
    }
}
