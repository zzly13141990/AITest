package com.oes.acct.vouch.cache;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.model.vo.TableMeta;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TableMetaRegistry {

    private static final Logger log = LoggerFactory.getLogger(TableMetaRegistry.class);

    private final Map<String, TableMeta> registry = new ConcurrentHashMap<>();

    public TableMetaRegistry() {
        registerDefaultTables();
    }

    private void registerDefaultTables() {
        register("sys_dept", "sys_dept", "dept_id", "dept_code", "dept_name");
        register("sys_emp", "sys_emp", "emp_id", "emp_code", "emp_name");
        register("sys_person", "sys_person", "person_id", "person_code", "person_name");
        register("sys_supplier", "sys_supplier", "supplier_id", "supplier_code", "supplier_name");
        register("sys_project", "sys_project", "project_id", "project_code", "project_name");
        register("sys_customer", "sys_customer", "customer_id", "customer_code", "customer_name");
        log.info("TableMetaRegistry initialized with {} tables", registry.size());
    }

    public void register(String tableId, String tableName, String primaryKey, String codeColumn, String nameColumn) {
        registry.put(tableId, new TableMeta(tableId, tableName, primaryKey, codeColumn, nameColumn));
    }

    public boolean contains(String tableId) {
        return registry.containsKey(tableId);
    }

    public TableMeta getTableMeta(String tableId) {
        TableMeta meta = registry.get(tableId);
        if (meta == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未注册的辅助核算表: " + tableId);
        }
        return meta;
    }
}
