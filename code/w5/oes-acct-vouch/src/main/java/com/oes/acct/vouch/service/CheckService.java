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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CheckService {

    private static final Logger log = LoggerFactory.getLogger(CheckService.class);

    private final SubjRepository subjRepository;
    private final CheckDefineCache checkDefineCache;
    private final DynamicSQLBuilder dynamicSQLBuilder;
    private final OtherFzSettingRepository otherFzSettingRepository;
    private final JdbcTemplate jdbcTemplate;

    public CheckService(SubjRepository subjRepository, CheckDefineCache checkDefineCache,
                        DynamicSQLBuilder dynamicSQLBuilder,
                        OtherFzSettingRepository otherFzSettingRepository,
                        JdbcTemplate jdbcTemplate) {
        this.subjRepository = subjRepository;
        this.checkDefineCache = checkDefineCache;
        this.dynamicSQLBuilder = dynamicSQLBuilder;
        this.otherFzSettingRepository = otherFzSettingRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Resolve subject check configuration.
     * Returns both standard check types and other fzhs configurations.
     */
    public SubjCheckConfig resolveSubjChecks(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        AcctSubj subj = subjRepository.findByCode(acctSubjCode, compCode, copyCode, acctYear);
        if (subj == null) {
            return new SubjCheckConfig(acctSubjCode, null, null, "0", "0", List.of(), List.of());
        }

        List<SubjCheckConfig.CheckTypeInfo> checks = new ArrayList<>();
        List<SubjCheckConfig.OtherFzhsInfo> otherFzhsChecks = new ArrayList<>();

        // Resolve standard check types (check_type1~8)
        if ("1".equals(subj.getIsCheck())) {
            for (int i = 1; i <= 8; i++) {
                String checkTypeName = getCheckTypeName(subj, i);
                if (checkTypeName != null && !checkTypeName.isBlank()) {
                    SysCheckDefine define = checkDefineCache.findByCheckName(checkTypeName);
                    if (define != null && !"1".equals(define.getIsStop())) {
                        checks.add(new SubjCheckConfig.CheckTypeInfo(
                                define.getCheckId(), define.getCheckName(),
                                define.getTableId(), i));
                    }
                }
            }
        }

        // Resolve other fzhs configurations
        List<AcctSubjOtherFzSetting> settings = otherFzSettingRepository
                .findVisibleBySubject(acctSubjCode, compCode, copyCode, acctYear);

        for (AcctSubjOtherFzSetting setting : settings) {
            String checkTypeName = getOtherCheckTypeName(subj, setting.getOtherFzhsIdx());
            otherFzhsChecks.add(new SubjCheckConfig.OtherFzhsInfo(
                    setting.getOtherFzhsIdx(),
                    checkTypeName != null ? checkTypeName : "",
                    setting.getInputType(),
                    setting.getDictType(),
                    setting.getDictName(),
                    setting.getIsShow(),
                    setting.getIsRequire(),
                    checkTypeName
            ));
        }

        return new SubjCheckConfig(subj.getAcctSubjCode(), subj.getAcctSubjName(), subj.getAcctSubjNameAll(),
                subj.getIsCheck(), subj.getIsBudge(), checks, otherFzhsChecks);
    }

    /**
     * Search subjects by keyword.
     */
    public List<AcctSubj> searchSubjects(String keyword, String compCode, String copyCode, String acctYear, int limit) {
        return subjRepository.searchByCode(keyword, compCode, copyCode, acctYear, limit);
    }

    /**
     * Load check options from archive table.
     */
    public List<CheckOption> loadCheckOptions(Integer checkId, String compCode, String copyCode, String acctYear) {
        SysCheckDefine define = checkDefineCache.getCheckDefine(checkId);
        List<Object> params = new ArrayList<>();
        String sql = dynamicSQLBuilder.buildQuerySQL(define.getTableId(), define.getWhereSql(),
                compCode, copyCode, acctYear, params);

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            int id = rs.getInt("id");
            String code = rs.getString("code");
            String name = rs.getString("name");
            return new CheckOption(id, code, name);
        }, params.toArray());
    }

    /**
     * Get top N subjects ordered by code.
     */
    public List<AcctSubj> getTopSubjects(String compCode, String copyCode, String acctYear) {
        return subjRepository.findTopByCode(compCode, copyCode, acctYear);
    }

    /**
     * Get check type name from subject by index (1~8).
     */
    private String getCheckTypeName(AcctSubj subj, int index) {
        return switch (index) {
            case 1 -> subj.getCheckType1();
            case 2 -> subj.getCheckType2();
            case 3 -> subj.getCheckType3();
            case 4 -> subj.getCheckType4();
            case 5 -> subj.getCheckType5();
            case 6 -> subj.getCheckType6();
            case 7 -> subj.getCheckType7();
            case 8 -> subj.getCheckType8();
            default -> null;
        };
    }

    /**
     * Get other check type name from subject by index (1~5).
     */
    private String getOtherCheckTypeName(AcctSubj subj, int index) {
        return switch (index) {
            case 1 -> subj.getOtherChecktype1();
            case 2 -> subj.getOtherChecktype2();
            case 3 -> subj.getOtherChecktype3();
            case 4 -> subj.getOtherChecktype4();
            case 5 -> subj.getOtherChecktype5();
            default -> null;
        };
    }
}
