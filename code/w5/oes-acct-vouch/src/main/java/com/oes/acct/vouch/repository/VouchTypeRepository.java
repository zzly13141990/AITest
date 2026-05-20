package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctVouchType;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VouchTypeRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchTypeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AcctVouchType> findAll() {
        String sql = "SELECT * FROM acct_vouch_type ORDER BY vouch_type_id";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouchType.class));
    }
}
