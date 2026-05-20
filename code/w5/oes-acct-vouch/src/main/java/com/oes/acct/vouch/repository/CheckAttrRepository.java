package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctCheckAttr;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CheckAttrRepository {

    private final JdbcTemplate jdbcTemplate;

    public CheckAttrRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AcctCheckAttr> findByMainTableId(Integer mainTableId) {
        String sql = "SELECT * FROM acct_check_attr WHERE main_table_id = ? AND is_stop = '0'";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctCheckAttr.class), mainTableId);
    }

    public List<AcctCheckAttr> findByAttrTableId(Integer attrTableId) {
        String sql = "SELECT * FROM acct_check_attr WHERE attr_table_id = ? AND is_stop = '0'";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctCheckAttr.class), attrTableId);
    }

    public List<AcctCheckAttr> findAll() {
        String sql = "SELECT * FROM acct_check_attr WHERE is_stop = '0'";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctCheckAttr.class));
    }
}
