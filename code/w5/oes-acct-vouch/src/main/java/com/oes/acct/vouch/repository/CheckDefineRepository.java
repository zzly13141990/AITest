package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.SysCheckDefine;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CheckDefineRepository {

    private final JdbcTemplate jdbcTemplate;

    public CheckDefineRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SysCheckDefine> findAll() {
        String sql = "SELECT * FROM sys_check_define ORDER BY check_id";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SysCheckDefine.class));
    }

    public SysCheckDefine findById(Integer checkId) {
        String sql = "SELECT * FROM sys_check_define WHERE check_id = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SysCheckDefine.class), checkId)
                .stream().findFirst().orElse(null);
    }

    public SysCheckDefine findByCheckName(String checkName) {
        String sql = "SELECT * FROM sys_check_define WHERE check_name = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(SysCheckDefine.class), checkName)
                .stream().findFirst().orElse(null);
    }
}
