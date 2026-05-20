package com.oes.acct.vouch.service;

import com.oes.acct.vouch.cache.CheckDefineCache;
import com.oes.acct.vouch.model.dto.CheckOption;
import com.oes.acct.vouch.model.dto.SubjCheckConfig;
import com.oes.acct.vouch.model.entity.AcctSubj;
import com.oes.acct.vouch.model.entity.AcctSubjOtherFzSetting;
import com.oes.acct.vouch.model.entity.SysCheckDefine;
import com.oes.acct.vouch.repository.OtherFzSettingRepository;
import com.oes.acct.vouch.repository.SubjRepository;
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
class CheckServiceTest {

    @Mock
    private SubjRepository subjRepository;

    @Mock
    private CheckDefineCache checkDefineCache;

    @Mock
    private DynamicSQLBuilder dynamicSQLBuilder;

    @Mock
    private OtherFzSettingRepository otherFzSettingRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private CheckService checkService;

    private AcctSubj createSubjectWithChecks(String code, String name, String isCheck,
                                               String ct1, String ct2, String oct1, String oct2) {
        AcctSubj subj = new AcctSubj();
        subj.setAcctSubjCode(code);
        subj.setAcctSubjName(name);
        subj.setCompCode("01");
        subj.setCopyCode("001");
        subj.setAcctYear("2026");
        subj.setIsCheck(isCheck);
        subj.setCheckType1(ct1);
        subj.setCheckType2(ct2);
        subj.setOtherChecktype1(oct1);
        subj.setOtherChecktype2(oct2);
        return subj;
    }

    @Test
    void resolveSubjChecks_whenSubjectNotFound_shouldReturnEmptyConfig() {
        when(subjRepository.findByCode("9999", "01", "001", "2026")).thenReturn(null);

        SubjCheckConfig config = checkService.resolveSubjChecks("9999", "01", "001", "2026");

        assertEquals("9999", config.acctSubjCode());
        assertEquals("0", config.isCheck());
        assertTrue(config.checks().isEmpty());
        assertTrue(config.otherFzhsChecks().isEmpty());
    }

    @Test
    void resolveSubjChecks_whenSubjectHasChecks_shouldResolveStandardAndOther() {
        AcctSubj subj = createSubjectWithChecks("1001", "库存现金", "1",
                "部门", "项目", "日期", "结算方式");
        when(subjRepository.findByCode("1001", "01", "001", "2026")).thenReturn(subj);

        SysCheckDefine deptDef = new SysCheckDefine();
        deptDef.setCheckId(1001);
        deptDef.setCheckName("部门");
        deptDef.setTableId("sys_dept");
        deptDef.setIsStop("0");

        SysCheckDefine projDef = new SysCheckDefine();
        projDef.setCheckId(1002);
        projDef.setCheckName("项目");
        projDef.setTableId("sys_project");
        projDef.setIsStop("0");

        when(checkDefineCache.findByCheckName("部门")).thenReturn(deptDef);
        when(checkDefineCache.findByCheckName("项目")).thenReturn(projDef);

        AcctSubjOtherFzSetting setting1 = new AcctSubjOtherFzSetting();
        setting1.setOtherFzhsIdx(1);
        setting1.setInputType("4");
        setting1.setDictType("date_dict");
        setting1.setIsShow(1);
        setting1.setIsRequire(1);

        when(otherFzSettingRepository.findVisibleBySubject("1001", "01", "001", "2026"))
                .thenReturn(List.of(setting1));

        SubjCheckConfig config = checkService.resolveSubjChecks("1001", "01", "001", "2026");

        assertEquals("1001", config.acctSubjCode());
        assertEquals("1", config.isCheck());
        assertEquals(2, config.checks().size());
        assertEquals("部门", config.checks().get(0).checkName());
        assertEquals("项目", config.checks().get(1).checkName());
        assertEquals(1, config.otherFzhsChecks().size());
        assertEquals(1, config.otherFzhsChecks().get(0).otherFzhsIdx());
    }

    @Test
    void resolveSubjChecks_shouldSkipStoppedDefines() {
        AcctSubj subj = createSubjectWithChecks("1001", "库存现金", "1",
                "已停用的部门", null, null, null);
        when(subjRepository.findByCode("1001", "01", "001", "2026")).thenReturn(subj);

        SysCheckDefine stoppedDef = new SysCheckDefine();
        stoppedDef.setIsStop("1");
        when(checkDefineCache.findByCheckName("已停用的部门")).thenReturn(stoppedDef);

        SubjCheckConfig config = checkService.resolveSubjChecks("1001", "01", "001", "2026");

        assertTrue(config.checks().isEmpty());
    }

    @Test
    void resolveSubjChecks_whenIsCheckIs0_shouldReturnEmptyChecks() {
        AcctSubj subj = createSubjectWithChecks("1001", "库存现金", "0",
                null, null, null, null);
        when(subjRepository.findByCode("1001", "01", "001", "2026")).thenReturn(subj);

        SubjCheckConfig config = checkService.resolveSubjChecks("1001", "01", "001", "2026");

        assertTrue(config.checks().isEmpty());
    }

    @Test
    void searchSubjects_shouldDelegateToRepository() {
        AcctSubj subj = new AcctSubj();
        subj.setAcctSubjCode("1001");
        when(subjRepository.searchByCode("100", "01", "001", "2026", 20))
                .thenReturn(List.of(subj));

        List<AcctSubj> results = checkService.searchSubjects("100", "01", "001", "2026", 20);

        assertEquals(1, results.size());
        assertEquals("1001", results.getFirst().getAcctSubjCode());
    }

    @Test
    void loadCheckOptions_shouldBuildSQLAndQuery() {
        SysCheckDefine define = new SysCheckDefine();
        define.setCheckId(1001);
        define.setTableId("sys_dept");
        define.setWhereSql("comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear");
        when(checkDefineCache.getCheckDefine(1001)).thenReturn(define);

        String expectedSQL = "SELECT id, code, name FROM sys_dept WHERE ...";
        when(dynamicSQLBuilder.buildQuerySQL(eq("sys_dept"),
                eq("comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear"),
                eq("01"), eq("001"), eq("2026"), any()))
                .thenReturn(expectedSQL);

        CheckOption opt1 = new CheckOption(1, "D001", "财务部");
        when(jdbcTemplate.query(eq(expectedSQL), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of(opt1));

        List<CheckOption> options = checkService.loadCheckOptions(1001, "01", "001", "2026");

        assertEquals(1, options.size());
        assertEquals("D001", options.getFirst().code());

        // Verify correct delegation chain
        verify(dynamicSQLBuilder).buildQuerySQL(eq("sys_dept"),
                eq("comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear"),
                eq("01"), eq("001"), eq("2026"), any());
        verify(jdbcTemplate).query(eq(expectedSQL), any(RowMapper.class), any(Object[].class));
    }

    @Test
    void loadCheckOptions_whenWhereSqlNull_shouldBuildSQL() {
        SysCheckDefine define = new SysCheckDefine();
        define.setCheckId(1001);
        define.setTableId("sys_dept");
        define.setWhereSql(null);
        when(checkDefineCache.getCheckDefine(1001)).thenReturn(define);

        String expectedSQL = "SELECT id, code, name FROM sys_dept WHERE ...";
        when(dynamicSQLBuilder.buildQuerySQL(eq("sys_dept"), isNull(), isNull(), eq("001"), eq("2026"), any()))
                .thenReturn(expectedSQL);

        CheckOption opt = new CheckOption(1, "D001", "财务部");
        when(jdbcTemplate.query(eq(expectedSQL), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of(opt));

        List<CheckOption> options = checkService.loadCheckOptions(1001, null, "001", "2026");

        assertEquals(1, options.size());

        verify(dynamicSQLBuilder).buildQuerySQL(eq("sys_dept"), isNull(), isNull(), eq("001"), eq("2026"), any());
    }
}
