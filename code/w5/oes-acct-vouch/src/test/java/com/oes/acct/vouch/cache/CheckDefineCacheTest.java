package com.oes.acct.vouch.cache;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.model.entity.SysCheckDefine;
import com.oes.acct.vouch.repository.CheckDefineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckDefineCacheTest {

    @Mock
    private CheckDefineRepository repository;

    private CheckDefineCache cache;

    @BeforeEach
    void setUp() {
        SysCheckDefine deptDef = new SysCheckDefine();
        deptDef.setCheckId(1001);
        deptDef.setCheckName("部门");
        deptDef.setTableId("sys_dept");
        deptDef.setIsStop("0");

        SysCheckDefine empDef = new SysCheckDefine();
        empDef.setCheckId(1002);
        empDef.setCheckName("员工");
        empDef.setTableId("sys_emp");
        empDef.setIsStop("0");

        SysCheckDefine stoppedDef = new SysCheckDefine();
        stoppedDef.setCheckId(1003);
        stoppedDef.setCheckName("已停用");
        stoppedDef.setTableId("sys_old");
        stoppedDef.setIsStop("1");

        when(repository.findAll()).thenReturn(List.of(deptDef, empDef, stoppedDef));

        cache = new CheckDefineCache(repository);
        cache.init();
    }

    @Test
    void init_shouldLoadActiveDefinesOnly() {
        assertEquals(2, cache.size());
    }

    @Test
    void getCheckDefine_withExistingId_shouldReturnDefine() {
        SysCheckDefine result = cache.getCheckDefine(1001);
        assertNotNull(result);
        assertEquals("部门", result.getCheckName());
    }

    @Test
    void getCheckDefine_withNonExistingId_shouldThrow() {
        assertThrows(BusinessException.class, () -> cache.getCheckDefine(9999));
    }

    @Test
    void findByCheckName_withExistingName_shouldReturnDefine() {
        SysCheckDefine result = cache.findByCheckName("部门");
        assertNotNull(result);
        assertEquals(1001, result.getCheckId());
    }

    @Test
    void findByCheckName_withNonExistingName_shouldReturnNull() {
        assertNull(cache.findByCheckName("不存在的名称"));
    }

    @Test
    void findByTableId_withExistingTableId_shouldReturnDefine() {
        SysCheckDefine result = cache.findByTableId("sys_dept");
        assertNotNull(result);
        assertEquals(1001, result.getCheckId());
    }

    @Test
    void findByTableId_withNonExistingTableId_shouldReturnNull() {
        assertNull(cache.findByTableId("sys_unknown"));
    }

    @Test
    void refresh_shouldReloadFromRepository() {
        when(repository.findAll()).thenReturn(List.of());
        cache.refresh();
        assertEquals(0, cache.size());
    }

    @Test
    void refresh_shouldNotIncludeStoppedDefines() {
        verify(repository, times(1)).findAll();
    }

    @Test
    void getCheckDefine_withStoppedDefine_shouldNotBeFound() {
        assertThrows(BusinessException.class, () -> cache.getCheckDefine(1003));
    }
}
