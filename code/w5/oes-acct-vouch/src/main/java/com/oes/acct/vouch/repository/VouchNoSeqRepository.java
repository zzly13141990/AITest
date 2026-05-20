package com.oes.acct.vouch.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class VouchNoSeqRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchNoSeqRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Increment and get next sequence number using optimistic locking.
     * @return number of rows affected (0 = conflict, retry needed)
     */
    public int incrementAndGet(String compCode, String copyCode, String acctYear, String acctMonth, int expectedVersion) {
        String sql = """
            UPDATE acct_vouch_no_seq
            SET next_no = next_no + 1, version = version + 1
            WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?
            AND version = ?
            """;
        return jdbcTemplate.update(sql, compCode, copyCode, acctYear, acctMonth, expectedVersion);
    }

    /**
     * Initialize sequence record if not exists.
     */
    public void initIfAbsent(String compCode, String copyCode, String acctYear, String acctMonth) {
        String sql = """
            IF NOT EXISTS (SELECT 1 FROM acct_vouch_no_seq
                WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?)
            BEGIN
                INSERT INTO acct_vouch_no_seq (comp_code, copy_code, acct_year, acct_month, next_no, version)
                VALUES (?, ?, ?, ?, 1, 0)
            END
            """;
        jdbcTemplate.update(sql, compCode, copyCode, acctYear, acctMonth,
                compCode, copyCode, acctYear, acctMonth);
    }

    public Integer getCurrentNo(String compCode, String copyCode, String acctYear, String acctMonth) {
        String sql = "SELECT next_no FROM acct_vouch_no_seq WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, compCode, copyCode, acctYear, acctMonth);
    }

    public Integer getVersion(String compCode, String copyCode, String acctYear, String acctMonth) {
        String sql = "SELECT version FROM acct_vouch_no_seq WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, compCode, copyCode, acctYear, acctMonth);
    }
}
