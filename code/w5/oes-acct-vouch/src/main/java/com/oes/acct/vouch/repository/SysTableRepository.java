package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.dto.SysTableConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SysTableRepository {

    private final JdbcTemplate jdbcTemplate;

    public SysTableRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SysTableConfig findByTableId(String tableId) {
        String sql = "SELECT table_id, table_name, id_field, code_field, name_field, "
                   + "table_level, is_year, year_field, stop_field, is_last_field "
                   + "FROM sys_table WHERE table_id = ?";
        List<SysTableConfig> results = jdbcTemplate.query(sql, (rs, rowNum) -> new SysTableConfig(
                rs.getString("table_id"),
                rs.getString("table_name"),
                rs.getString("id_field"),
                rs.getString("code_field"),
                rs.getString("name_field"),
                rs.getString("table_level"),
                rs.getString("is_year"),
                rs.getString("year_field"),
                rs.getString("stop_field"),
                rs.getString("is_last_field")
        ), tableId);
        return results.stream().findFirst().orElse(null);
    }
}
