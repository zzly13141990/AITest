package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctSubj;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SubjRepository {

    private final JdbcTemplate jdbcTemplate;

    public SubjRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AcctSubj findByCode(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        String sql = "SELECT * FROM acct_subj WHERE is_last = '1' AND acct_subj_code = ? AND comp_code = ? AND copy_code = ? AND acct_year = ?";
        List<AcctSubj> results = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctSubj.class),
                acctSubjCode, compCode, copyCode, acctYear);
        return results.stream().findFirst().orElse(null);
    }

    public List<AcctSubj> searchByCode(String keyword, String compCode, String copyCode, String acctYear, int limit) {
        String sql = """
            SELECT TOP (?) * FROM acct_subj
            WHERE (acct_subj_code LIKE ? OR acct_subj_name LIKE ?)
            AND comp_code = ? AND copy_code = ? AND acct_year = ?
            AND is_stop = '0' and is_last = '1'
            ORDER BY acct_subj_code
            """;
        String pattern = "%" + keyword + "%";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctSubj.class),
                limit, pattern, pattern, compCode, copyCode, acctYear);
    }

    public boolean isLeafSubject(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        String sql = "SELECT is_last FROM acct_subj WHERE  is_last = '1' and acct_subj_code = ? AND comp_code = ? AND copy_code = ? AND acct_year = ?";
        String isLast = jdbcTemplate.queryForObject(sql, String.class, acctSubjCode, compCode, copyCode, acctYear);
        return "1".equals(isLast);
    }

    public List<AcctSubj> findTopByCode(String compCode, String copyCode, String acctYear) {
        String sql = """
            SELECT  * FROM acct_subj
            WHERE comp_code = ? AND copy_code = ? AND acct_year = ?
            AND is_stop = '0' and is_last = '1'
            ORDER BY acct_subj_code
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctSubj.class),
                 compCode, copyCode, acctYear);
    }
}
