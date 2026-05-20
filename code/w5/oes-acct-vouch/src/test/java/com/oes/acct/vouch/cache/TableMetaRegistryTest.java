package com.oes.acct.vouch.cache;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.model.vo.TableMeta;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TableMetaRegistryTest {

    private TableMetaRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new TableMetaRegistry();
    }

    @Test
    void init_shouldRegisterDefaultTables() {
        assertTrue(registry.contains("sys_dept"));
        assertTrue(registry.contains("sys_emp"));
        assertTrue(registry.contains("sys_person"));
        assertTrue(registry.contains("sys_supplier"));
        assertTrue(registry.contains("sys_project"));
        assertTrue(registry.contains("sys_customer"));
    }

    @Test
    void contains_withUnregistered_shouldReturnFalse() {
        assertFalse(registry.contains("sys_unknown"));
    }

    @Test
    void getTableMeta_withRegistered_shouldReturnCorrectMeta() {
        TableMeta meta = registry.getTableMeta("sys_dept");
        assertEquals("sys_dept", meta.tableId());
        assertEquals("sys_dept", meta.tableName());
        assertEquals("dept_id", meta.primaryKey());
    }

    @Test
    void getTableMeta_withUnregistered_shouldThrow() {
        assertThrows(BusinessException.class, () -> registry.getTableMeta("invalid"));
    }

    @Test
    void register_shouldAddNewTable() {
        registry.register("test_table", "test_table", "id", "code", "name");
        assertTrue(registry.contains("test_table"));
        TableMeta meta = registry.getTableMeta("test_table");
        assertEquals("test_table", meta.tableName());
    }

    @Test
    void register_shouldOverwriteExisting() {
        registry.register("sys_dept", "custom_dept", "id", "c", "n");
        TableMeta meta = registry.getTableMeta("sys_dept");
        assertEquals("custom_dept", meta.tableName());
    }
}
