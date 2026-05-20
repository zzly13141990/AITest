package com.oes.acct.vouch.util;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.model.dto.SysTableConfig;
import com.oes.acct.vouch.model.vo.TableMeta;
import com.oes.acct.vouch.repository.SysTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DynamicSQLBuilder {

    private static final Logger log = LoggerFactory.getLogger(DynamicSQLBuilder.class);

    private final Map<String, TableMeta> tableMetaRegistry = new ConcurrentHashMap<>();
    private final Set<String> allowedTables = ConcurrentHashMap.newKeySet();
    private final SysTableRepository sysTableRepository;

    private static final Map<String, String> FALLBACK_ALLOWED_TABLES = Map.of(
            "sys_dept", "sys_dept",
            "sys_emp", "sys_emp",
            "sys_person", "sys_person",
            "sys_supplier", "sys_supplier",
            "sys_project", "sys_project",
            "sys_customer", "sys_customer"
    );

    public DynamicSQLBuilder(SysTableRepository sysTableRepository) {
        this.sysTableRepository = sysTableRepository;
        allowedTables.addAll(FALLBACK_ALLOWED_TABLES.keySet());
        // Register known table metadata (fallback when sys_table entry is missing)
        registerTableMeta("sys_dept", "sys_dept", "dept_id", "dept_code", "dept_name");
        registerTableMeta("sys_emp", "sys_emp", "emp_id", "emp_code", "emp_name");
        registerTableMeta("sys_person", "sys_person", "person_id", "person_code", "person_name");
        registerTableMeta("sys_supplier", "sys_supplier", "supplier_id", "supplier_code", "supplier_name");
        registerTableMeta("sys_project", "sys_project", "project_id", "project_code", "project_name");
        registerTableMeta("sys_customer", "sys_customer", "customer_id", "customer_code", "customer_name");
    }

    public void registerTableMeta(String tableId, String tableName, String primaryKey, String codeColumn, String nameColumn) {
        tableMetaRegistry.put(tableId, new TableMeta(tableId, tableName, primaryKey, codeColumn, nameColumn));
        allowedTables.add(tableId);
    }

    public boolean containsTable(String tableId) {
        return allowedTables.contains(tableId);
    }

    public void validateTableId(String tableId) {
        if (!allowedTables.contains(tableId)) {
            // Auto-register if exists in sys_table database
            SysTableConfig sysTable = sysTableRepository.findByTableId(tableId);
            if (sysTable != null) {
                log.info("Auto-registered table from sys_table: {}", tableId);
                allowedTables.add(tableId);
                return;
            }
            log.warn("非法表名访问尝试: {}", tableId);
            throw new BusinessException(ErrorCode.PARAM_INVALID, "非法的辅助核算表名: " + tableId);
        }
    }

    public TableMeta getTableMeta(String tableId) {
        TableMeta meta = tableMetaRegistry.get(tableId);
        if (meta == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未注册的辅助核算表: " + tableId);
        }
        return meta;
    }

    /**
     * Build a safe parameterized SQL query for fetching check options.
     * Looks up sys_table for field names, org-level, and year conditions.
     * Falls back to hardcoded registry when no sys_table entry exists.
     *
     * @param tableId   logical table ID from sys_check_define
     * @param whereSql  where_sql from sys_check_define (may contain :compCode/:copyCode/:acctYear placeholders)
     * @param compCode  company code
     * @param copyCode  copy code
     * @param acctYear  accounting year
     * @param params    output list to collect parameter values (caller supplies an empty list)
     * @return the built SQL string
     */
    public String buildQuerySQL(String tableId, String whereSql,
                                 String compCode, String copyCode, String acctYear,
                                 List<Object> params) {
        validateTableId(tableId);

        // Try to load table config from sys_table dynamically
        SysTableConfig sysTable = sysTableRepository.findByTableId(tableId);

        String tableName;
        String idField;
        String codeField;
        String nameField;
        String stopField = null;
        String isLastField = null;

        if (sysTable != null) {
            tableName = sysTable.tableName() != null ? sysTable.tableName() : tableId;
            idField = sysTable.idField() != null ? sysTable.idField() : "id";
            codeField = sysTable.codeField() != null ? sysTable.codeField() : "code";
            nameField = sysTable.nameField() != null ? sysTable.nameField() : "name";
            stopField = sysTable.stopField();
            isLastField = sysTable.isLastField();
            allowedTables.add(tableId);
        } else {
            // Fallback to hardcoded registry
            TableMeta meta = getTableMeta(tableId);
            tableName = meta.tableName();
            idField = meta.primaryKey();
            codeField = meta.codeColumn();
            nameField = meta.nameColumn();
        }

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ")
           .append(idField).append(" AS id, ")
           .append(codeField).append(" AS code, ")
           .append(nameField).append(" AS name")
           .append(" FROM [").append(tableId).append("]")
           .append(" WHERE 1=1");

        // Resolve where_sql from sys_check_define
        WhereSqlTemplate template = WhereSqlTemplate.resolve(whereSql);
        if (template != WhereSqlTemplate.DEFAULT && template != WhereSqlTemplate.BY_STANDARD) {
            String resolvedSql = whereSql
                    .replace(":compCode", "?")
                    .replace(":copyCode", "?")
                    .replace(":acctYear", "?");
            sql.append(" AND (").append(resolvedSql).append(")");
            // Collect params for whereSql placeholders
            if (whereSql.contains(":compCode")) params.add(compCode);
            if (whereSql.contains(":copyCode")) params.add(copyCode);
            if (whereSql.contains(":acctYear")) params.add(acctYear);
        }

        // Add org-level conditions from sys_table config
        if (sysTable != null) {
            String tableLevel = sysTable.tableLevel();
            if ("2".equals(tableLevel)) {
                sql.append(" AND comp_code = ?");
                params.add(compCode);
            } else if ("3".equals(tableLevel)) {
                sql.append(" AND comp_code = ? AND copy_code = ?");
                params.add(compCode);
                params.add(copyCode);
            }

            // Add year condition
            String isYear = sysTable.isYear();
            String yearField = sysTable.yearField();
            if ("1".equals(isYear) && yearField != null && !yearField.isBlank()) {
                sql.append(" AND ").append(yearField).append(" = ?");
                params.add(acctYear);
            }
        }

        // Stop/disabled filter (only if configured in sys_table)
        if (stopField != null && !stopField.isBlank()) {
            sql.append(" AND ").append(stopField).append(" = '0'");
        }
        // Is-last filter (only if configured in sys_table)
        if (isLastField != null && !isLastField.isBlank()) {
            sql.append(" AND ").append(isLastField).append(" = '1'");
        }

        log.debug("Dynamic SQL: {}  params: {}", sql, params);
        return sql.toString();
    }

    /**
     * Legacy overload — kept for callers that don't need the new sys_table logic.
     * Builds SQL using only hardcoded registry and passes params directly.
     */
    public String buildQuerySQL(String tableId, String whereSql, String compCode, String copyCode, String acctYear) {
        java.util.ArrayList<Object> params = new java.util.ArrayList<>();
        return buildQuerySQL(tableId, whereSql, compCode, copyCode, acctYear, params);
    }

    /**
     * Build SQL for cascade check query.
     */
    public String buildCascadeQuerySQL(String attrTableName, String attrFieldCode, String mainFieldCode, String mainValue) {
        validateTableId(attrTableName);
        TableMeta meta = getTableMeta(attrTableName);

        return new StringBuilder()
                .append("SELECT ").append(meta.primaryKey()).append(" AS id, ")
                .append(meta.codeColumn()).append(" AS code, ")
                .append(meta.nameColumn()).append(" AS name")
                .append(" FROM [").append(meta.tableName()).append("]")
                .append(" WHERE ").append(attrFieldCode).append(" = ?")
                .append(" AND is_stop = '0'")
                .toString();
    }
}
