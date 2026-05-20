package com.oes.acct.vouch.service;

import com.oes.acct.vouch.cache.CheckDefineCache;
import com.oes.acct.vouch.model.dto.CheckOption;
import com.oes.acct.vouch.model.entity.AcctCheckAttr;
import com.oes.acct.vouch.model.entity.SysCheckDefine;
import com.oes.acct.vouch.repository.CheckAttrRepository;
import com.oes.acct.vouch.util.DynamicSQLBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CascadeCheckService {

    private static final Logger log = LoggerFactory.getLogger(CascadeCheckService.class);

    private final CheckAttrRepository checkAttrRepository;
    private final CheckDefineCache checkDefineCache;
    private final DynamicSQLBuilder dynamicSQLBuilder;
    private final JdbcTemplate jdbcTemplate;

    public CascadeCheckService(CheckAttrRepository checkAttrRepository, CheckDefineCache checkDefineCache,
                               DynamicSQLBuilder dynamicSQLBuilder, JdbcTemplate jdbcTemplate) {
        this.checkAttrRepository = checkAttrRepository;
        this.checkDefineCache = checkDefineCache;
        this.dynamicSQLBuilder = dynamicSQLBuilder;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Cascade check: given a main check value, find related check values.
     * Three-level matching strategy:
     * 1. Direct match by target_other_fzhs_idx
     * 2. Match by attr_table_id
     * 3. Fuzzy match by attr_show_name
     */
    public List<CheckOption> cascadeCheck(Integer mainTableId, String mainFieldValue, String compCode) {
        List<AcctCheckAttr> attrs = checkAttrRepository.findByMainTableId(mainTableId);
        List<CheckOption> results = new ArrayList<>();

        for (AcctCheckAttr attr : attrs) {
            try {
                SysCheckDefine attrDefine = checkDefineCache.getCheckDefine(attr.getAttrTableId());
                String sql = dynamicSQLBuilder.buildCascadeQuerySQL(
                        attrDefine.getTableId(),
                        attr.getAttrFieldCode(),
                        attr.getMainFieldCode(),
                        mainFieldValue);

                List<CheckOption> options = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    int id = rs.getInt("id");
                    String code = rs.getString("code");
                    String name = rs.getString("name");
                    return new CheckOption(id, code, name);
                }, mainFieldValue);

                results.addAll(options);
            } catch (Exception e) {
                log.warn("Cascade check failed for mainTableId={}, attr={}: {}", mainTableId, attr.getAttrId(), e.getMessage());
            }
        }

        return results;
    }

    /**
     * Find cascade configuration by target_other_fzhs_idx.
     */
    public AcctCheckAttr findByTargetOtherFzhsIdx(Integer targetOtherFzhsIdx) {
        List<AcctCheckAttr> all = checkAttrRepository.findAll();
        return all.stream()
                .filter(a -> a.getTargetOtherFzhsIdx() != null && a.getTargetOtherFzhsIdx().equals(targetOtherFzhsIdx))
                .findFirst()
                .orElse(null);
    }
}
