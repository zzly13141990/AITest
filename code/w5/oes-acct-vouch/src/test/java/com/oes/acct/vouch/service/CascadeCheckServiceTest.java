package com.oes.acct.vouch.service;

import com.oes.acct.vouch.cache.CheckDefineCache;
import com.oes.acct.vouch.model.dto.CheckOption;
import com.oes.acct.vouch.model.entity.AcctCheckAttr;
import com.oes.acct.vouch.model.entity.SysCheckDefine;
import com.oes.acct.vouch.repository.CheckAttrRepository;
import com.oes.acct.vouch.util.DynamicSQLBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CascadeCheckServiceTest {

    @Mock
    private CheckAttrRepository checkAttrRepository;

    @Mock
    private CheckDefineCache checkDefineCache;

    @Mock
    private DynamicSQLBuilder dynamicSQLBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private CascadeCheckService cascadeCheckService;

    @Test
    void cascadeCheck_shouldQueryAttrsAndReturnResults() {
        AcctCheckAttr attr = new AcctCheckAttr();
        attr.setAttrId(1);
        attr.setMainTableId(1);
        attr.setMainFieldCode("dept_id");
        attr.setAttrTableId(1001);
        attr.setAttrFieldCode("parent_id");

        SysCheckDefine define = new SysCheckDefine();
        define.setCheckId(1001);
        define.setTableId("sys_dept");

        when(checkAttrRepository.findByMainTableId(1)).thenReturn(List.of(attr));
        when(checkDefineCache.getCheckDefine(1001)).thenReturn(define);
        when(dynamicSQLBuilder.buildCascadeQuerySQL("sys_dept", "parent_id", "dept_id", "D001"))
                .thenReturn("SELECT * FROM sys_dept WHERE parent_id = ? AND is_stop = '0'");
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("D001")))
                .thenReturn(List.of(new CheckOption(1, "D002", "子部门")));

        List<CheckOption> results = cascadeCheckService.cascadeCheck(1, "D001", "01");

        assertEquals(1, results.size());
        assertEquals("D002", results.getFirst().code());
    }

    @Test
    void cascadeCheck_whenNoAttrs_shouldReturnEmpty() {
        when(checkAttrRepository.findByMainTableId(999)).thenReturn(List.of());

        List<CheckOption> results = cascadeCheckService.cascadeCheck(999, "D001", "01");

        assertTrue(results.isEmpty());
    }

    @Test
    void cascadeCheck_whenExceptionInOneAttr_shouldSkip() {
        AcctCheckAttr attr = new AcctCheckAttr();
        attr.setAttrId(1);
        attr.setAttrTableId(1001);

        when(checkAttrRepository.findByMainTableId(1)).thenReturn(List.of(attr));
        when(checkDefineCache.getCheckDefine(1001)).thenThrow(new RuntimeException("Cache error"));

        List<CheckOption> results = cascadeCheckService.cascadeCheck(1, "D001", "01");

        assertTrue(results.isEmpty());
    }

    @Test
    void findByTargetOtherFzhsIdx_whenFound_shouldReturnAttr() {
        AcctCheckAttr attr1 = new AcctCheckAttr();
        attr1.setAttrId(1);
        attr1.setTargetOtherFzhsIdx(3);

        AcctCheckAttr attr2 = new AcctCheckAttr();
        attr2.setAttrId(2);
        attr2.setTargetOtherFzhsIdx(5);

        when(checkAttrRepository.findAll()).thenReturn(List.of(attr1, attr2));

        AcctCheckAttr result = cascadeCheckService.findByTargetOtherFzhsIdx(3);
        assertNotNull(result);
        assertEquals(1, result.getAttrId());
    }

    @Test
    void findByTargetOtherFzhsIdx_whenNotFound_shouldReturnNull() {
        when(checkAttrRepository.findAll()).thenReturn(List.of());

        AcctCheckAttr result = cascadeCheckService.findByTargetOtherFzhsIdx(999);
        assertNull(result);
    }

    @Test
    void findByTargetOtherFzhsIdx_withNullTargetIdx_shouldSkip() {
        AcctCheckAttr attr = new AcctCheckAttr();
        attr.setAttrId(1);

        when(checkAttrRepository.findAll()).thenReturn(List.of(attr));

        AcctCheckAttr result = cascadeCheckService.findByTargetOtherFzhsIdx(999);
        assertNull(result);
    }
}
