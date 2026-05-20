package com.oes.acct.vouch.util;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.model.dto.SysTableConfig;
import com.oes.acct.vouch.model.vo.TableMeta;
import com.oes.acct.vouch.repository.SysTableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DynamicSQLBuilderTest {

    private DynamicSQLBuilder builder;
    private SysTableRepository mockSysTableRepo;

    @BeforeEach
    void setUp() {
        mockSysTableRepo = mock(SysTableRepository.class);
        when(mockSysTableRepo.findByTableId(anyString())).thenReturn(null);
        builder = new DynamicSQLBuilder(mockSysTableRepo);
    }

    @Test
    void containsTable_withValidTable_shouldReturnTrue() {
        assertTrue(builder.containsTable("sys_dept"));
        assertTrue(builder.containsTable("sys_emp"));
    }

    @Test
    void containsTable_withInvalidTable_shouldReturnFalse() {
        assertFalse(builder.containsTable("sys_unknown"));
    }

    @Test
    void validateTableId_withValidTable_shouldNotThrow() {
        assertDoesNotThrow(() -> builder.validateTableId("sys_dept"));
    }

    @Test
    void validateTableId_withInvalidTable_shouldThrow() {
        assertThrows(BusinessException.class, () -> builder.validateTableId("hack_table"));
    }

    @Test
    void getTableMeta_withValidTable_shouldReturnMeta() {
        TableMeta meta = builder.getTableMeta("sys_dept");
        assertNotNull(meta);
        assertEquals("sys_dept", meta.tableId());
        assertEquals("sys_dept", meta.tableName());
        assertEquals("dept_id", meta.primaryKey());
    }

    @Test
    void getTableMeta_withInvalidTable_shouldThrow() {
        assertThrows(BusinessException.class, () -> builder.getTableMeta("invalid"));
    }

    @Test
    void buildQuerySQL_fallback_withDefaultTemplate_shouldProduceSafeSQL() {
        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("sys_dept", null, "01", "001", "2026", params);
        assertTrue(sql.contains("SELECT"));
        assertTrue(sql.contains("FROM [sys_dept]"));
        // Fallback path: no stop_field configured, so no is_stop filter
        assertFalse(sql.contains("is_stop"));
        assertFalse(sql.contains(":compCode"));
        assertTrue(params.isEmpty());
    }

    @Test
    void buildQuerySQL_fallback_withByCompCopyYearTemplate_shouldReplacePlaceholders() {
        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("sys_dept",
                "comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear",
                "01", "001", "2026", params);
        assertTrue(sql.contains("?"));
        assertFalse(sql.contains(":compCode"));
        // Fallback path: no stop_field configured, so no is_stop filter
        assertFalse(sql.contains("is_stop"));
        assertEquals(3, params.size());
        assertEquals("01", params.get(0));
        assertEquals("001", params.get(1));
        assertEquals("2026", params.get(2));
    }

    @Test
    void buildQuerySQL_withInvalidTableId_shouldThrow() {
        List<Object> params = new ArrayList<>();
        assertThrows(BusinessException.class,
                () -> builder.buildQuerySQL("hack_table", null, "01", "001", "2026", params));
    }

    @Test
    void buildQuerySQL_withSysTable_level2_shouldAddCompCode() {
        SysTableConfig config = new SysTableConfig("my_business", "my_business",
                "biz_id", "biz_code", "biz_name", "2", "0", null, "stop_flag", null);
        when(mockSysTableRepo.findByTableId("my_business")).thenReturn(config);

        builder.registerTableMeta("my_business", "my_business", "biz_id", "biz_code", "biz_name");

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("my_business", null, "01", "001", "2026", params);

        assertTrue(sql.contains("comp_code = ?"));
        assertEquals(1, params.size());
        assertEquals("01", params.get(0));
        assertTrue(sql.contains("stop_flag = '0'"));
        assertFalse(sql.contains("is_last"));
    }

    @Test
    void buildQuerySQL_withSysTable_level3_shouldAddCompCodeAndCopyCode() {
        SysTableConfig config = new SysTableConfig("my_business", "my_business",
                "biz_id", "biz_code", "biz_name", "3", "0", null, "stop_flag", null);
        when(mockSysTableRepo.findByTableId("my_business")).thenReturn(config);

        builder.registerTableMeta("my_business", "my_business", "biz_id", "biz_code", "biz_name");

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("my_business", null, "01", "001", "2026", params);

        assertTrue(sql.contains("comp_code = ?"));
        assertTrue(sql.contains("copy_code = ?"));
        assertEquals(2, params.size());
        assertEquals("01", params.get(0));
        assertEquals("001", params.get(1));
        assertTrue(sql.contains("stop_flag = '0'"));
    }

    @Test
    void buildQuerySQL_withSysTable_isYear_shouldAddYearCondition() {
        SysTableConfig config = new SysTableConfig("my_business", "my_business",
                "biz_id", "biz_code", "biz_name", "2", "1", "acct_year", "stop_flag", null);
        when(mockSysTableRepo.findByTableId("my_business")).thenReturn(config);

        builder.registerTableMeta("my_business", "my_business", "biz_id", "biz_code", "biz_name");

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("my_business", null, "01", "001", "2026", params);

        assertTrue(sql.contains("comp_code = ?"));
        assertTrue(sql.contains("acct_year = ?"));
        assertEquals(2, params.size());
        assertEquals("01", params.get(0));
        assertEquals("2026", params.get(1));
        assertTrue(sql.contains("stop_flag = '0'"));
    }

    @Test
    void buildQuerySQL_withSysTable_shouldUseIdCodeNameFields() {
        SysTableConfig config = new SysTableConfig("my_business", "my_business",
                "my_id", "my_code", "my_name", "0", "0", null, "stop_flag", null);
        when(mockSysTableRepo.findByTableId("my_business")).thenReturn(config);

        builder.registerTableMeta("my_business", "my_business", "biz_id", "biz_code", "biz_name");

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("my_business", null, "01", "001", "2026", params);

        assertTrue(sql.contains("my_id AS id"));
        assertTrue(sql.contains("my_code AS code"));
        assertTrue(sql.contains("my_name AS name"));
    }

    @Test
    void registerTableMeta_shouldAllowDynamicRegistration() {
        builder.registerTableMeta("new_table", "new_table", "id", "code", "name");
        assertTrue(builder.containsTable("new_table"));
        TableMeta meta = builder.getTableMeta("new_table");
        assertEquals("new_table", meta.tableName());
    }

    @Test
    void validateTableId_withSysTableEntry_shouldAutoRegister() {
        SysTableConfig config = new SysTableConfig("sys_money_resource", "sys_money_resource",
                "id", "code", "name", "0", "0", null, null, null);
        when(mockSysTableRepo.findByTableId("sys_money_resource")).thenReturn(config);

        assertDoesNotThrow(() -> builder.validateTableId("sys_money_resource"));
        assertTrue(builder.containsTable("sys_money_resource"));
    }

    @Test
    void buildQuerySQL_withAutoRegisteredTable_shouldUseSysTableConfig() {
        SysTableConfig config = new SysTableConfig("sys_money_resource", "sys_money_resource",
                "res_id", "res_code", "res_name", "2", "1", "acct_year", "stop_flag", null);
        when(mockSysTableRepo.findByTableId("sys_money_resource")).thenReturn(config);

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("sys_money_resource", null, "01", "001", "2026", params);

        assertTrue(sql.contains("res_id AS id"));
        assertTrue(sql.contains("res_code AS code"));
        assertTrue(sql.contains("res_name AS name"));
        assertTrue(sql.contains("comp_code = ?"));
        assertTrue(sql.contains("acct_year = ?"));
        assertTrue(sql.contains("stop_flag = '0'"));
        assertFalse(sql.contains("is_last"));
        assertEquals(2, params.size());
    }

    @Test
    void buildQuerySQL_withSysTable_isLastField_shouldAddCondition() {
        SysTableConfig config = new SysTableConfig("my_business", "my_business",
                "biz_id", "biz_code", "biz_name", "0", "0", null, "stop_flag", "is_last");
        when(mockSysTableRepo.findByTableId("my_business")).thenReturn(config);

        builder.registerTableMeta("my_business", "my_business", "biz_id", "biz_code", "biz_name");

        List<Object> params = new ArrayList<>();
        String sql = builder.buildQuerySQL("my_business", null, "01", "001", "2026", params);

        assertTrue(sql.contains("stop_flag = '0'"));
        assertTrue(sql.contains("is_last = '1'"));
    }

    @Test
    void buildCascadeQuerySQL_shouldProduceSafeSQL() {
        String sql = builder.buildCascadeQuerySQL("sys_dept", "parent_id", "dept_id", "D001");
        assertTrue(sql.contains("SELECT"));
        assertTrue(sql.contains("FROM [sys_dept]"));
        assertTrue(sql.contains("parent_id = ?"));
        assertTrue(sql.contains("is_stop = '0'"));
    }

    @Test
    void buildCascadeQuerySQL_withInvalidTable_shouldThrow() {
        assertThrows(BusinessException.class,
                () -> builder.buildCascadeQuerySQL("invalid_table", "col", "col2", "val"));
    }

    @Test
    void legacyOverload_shouldDelegateToNewOverload() {
        String sql = builder.buildQuerySQL("sys_dept", null, "01", "001", "2026");
        assertTrue(sql.contains("SELECT"));
        assertTrue(sql.contains("FROM [sys_dept]"));
    }
}
