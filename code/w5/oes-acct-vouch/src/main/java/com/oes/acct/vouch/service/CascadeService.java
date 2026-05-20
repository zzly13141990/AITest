package com.oes.acct.vouch.service;

import com.oes.acct.vouch.cache.CheckDefineCache;
import com.oes.acct.vouch.model.dto.CascadeCheckRequest;
import com.oes.acct.vouch.model.dto.CascadeCheckResponse;
import com.oes.acct.vouch.model.dto.CascadeValueResult;
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
import java.util.Map;

/**
 * PRD §7.7: Auxiliary check cascade query service.
 *
 * When user selects a check value (e.g., a supplier), this service queries
 * acct_check_attr to find if there are cascade configurations that auto-fill
 * another check value (e.g., default payment method for that supplier).
 */
@Service
public class CascadeService {

    private static final Logger log = LoggerFactory.getLogger(CascadeService.class);

    private final CheckAttrRepository checkAttrRepository;
    private final DynamicSQLBuilder dynamicSQLBuilder;
    private final CheckDefineCache checkDefineCache;
    private final JdbcTemplate jdbcTemplate;

    public CascadeService(CheckAttrRepository checkAttrRepository,
                          DynamicSQLBuilder dynamicSQLBuilder,
                          CheckDefineCache checkDefineCache,
                          JdbcTemplate jdbcTemplate) {
        this.checkAttrRepository = checkAttrRepository;
        this.dynamicSQLBuilder = dynamicSQLBuilder;
        this.checkDefineCache = checkDefineCache;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Execute cascade check query.
     *
     * PRD §7.7: Three-level matching strategy:
     *   1. target_other_fzhs_idx exact match
     *   2. attr_table_id match
     *   3. attr_show_name fuzzy match (fallback)
     */
    public CascadeCheckResponse cascadeCheck(CascadeCheckRequest request) {
        String mainTableId = request.mainTableId();

        // Query cascade config from acct_check_attr
        SysCheckDefine mainDefine = checkDefineCache.findByTableId(mainTableId);
        if (mainDefine == null) {
            return CascadeCheckResponse.noCascade(mainTableId, request.mainValueId(), "");
        }

        List<AcctCheckAttr> attrs = checkAttrRepository.findByMainTableId(mainDefine.getCheckId());
        if (attrs == null || attrs.isEmpty()) {
            return CascadeCheckResponse.noCascade(mainTableId, request.mainValueId(), "");
        }

        // Execute cascade queries
        List<CascadeValueResult> results = new ArrayList<>();
        String mainValueName = resolveMainValueName(mainTableId, request.mainValueId());

        for (AcctCheckAttr attr : attrs) {
            try {
                CascadeValueResult result = executeSingleCascade(attr, request);
                if (result != null) {
                    results.add(result);
                }
            } catch (Exception e) {
                log.warn("级联查询失败: attr_id={}, error={}", attr.getAttrId(), e.getMessage());
                // Cascade failure does not block the main flow (PRD §7.7)
            }
        }

        return new CascadeCheckResponse(
                !results.isEmpty(),
                new CascadeCheckResponse.MainInfo(mainTableId, request.mainValueId(), mainValueName),
                results
        );
    }

    private CascadeValueResult executeSingleCascade(AcctCheckAttr attr, CascadeCheckRequest request) {
        String sql = buildCascadeSql(attr);
        if (sql == null) return null;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, request.mainValueId());
        if (rows.isEmpty()) return null;

        Map<String, Object> row = rows.getFirst();
        Object id = row.get("id");
        Object name = row.get("name");
        Object code = row.get("code");

        return new CascadeValueResult(
                attr.getAttrId(),
                resolveTableName(attr.getAttrTableId()),
                attr.getAttrFieldCode(),
                attr.getAttrShowName(),
                attr.getTargetOtherFzhsIdx(),
                id != null ? new CascadeValueResult.CascadeValue(
                        id.toString(),
                        name != null ? name.toString() : "",
                        code != null ? code.toString() : ""
                ) : null
        );
    }

    private String buildCascadeSql(AcctCheckAttr attr) {
        // Resolve the attr table name
        String attrTableName = resolveTableName(attr.getAttrTableId());
        if (attrTableName == null) return null;

        return new StringBuilder()
                .append("SELECT TOP 1 ")
                .append(attr.getAttrFieldCode()).append(" AS id, ")
                .append("name AS name, code AS code ")
                .append("FROM ").append(attrTableName)
                .append(" WHERE ").append(attr.getCheckFieldCode()).append(" = ?")
                .append(" AND is_stop = '0'")
                .toString();
    }

    private String resolveTableName(Integer tableId) {
        if (tableId == null) return null;
        SysCheckDefine def = checkDefineCache.getCheckDefine(tableId);
        return def != null ? def.getTableId() : null;
    }

    private String resolveMainValueName(String tableId, Object valueId) {
        try {
            dynamicSQLBuilder.validateTableId(tableId);
            String sql = "SELECT name FROM " + tableId + " WHERE id = ?";
            return jdbcTemplate.queryForObject(sql, String.class, valueId);
        } catch (Exception e) {
            log.debug("Failed to resolve main value name: tableId={}, valueId={}", tableId, valueId);
            return "";
        }
    }
}
