package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctVouchDetail;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VouchDetailRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchDetailRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(AcctVouchDetail detail) {
        String sql = """
            INSERT INTO acct_vouch_detail (
                vouch_detail_id, vouch_id, vouch_page, vouch_row, summary, comp_code, copy_code,
                acct_year, acct_subj_code, amt_debit, amt_credit, other_subj_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
                detail.getVouchDetailId(),
                detail.getVouchId(),
                detail.getVouchPage(),
                detail.getVouchRow(),
                detail.getSummary(),
                detail.getCompCode(),
                detail.getCopyCode(),
                detail.getAcctYear(),
                detail.getAcctSubjCode(),
                detail.getAmtDebit(),
                detail.getAmtCredit(),
                detail.getOtherSubjCode());
    }

    public void update(AcctVouchDetail detail) {
        String sql = """
            UPDATE acct_vouch_detail SET
                acct_subj_code = ?, amt_debit = ?, amt_credit = ?,
                summary = ?, other_subj_code = ?
            WHERE vouch_detail_id = ?
            """;
        jdbcTemplate.update(sql,
                detail.getAcctSubjCode(), detail.getAmtDebit(), detail.getAmtCredit(),
                detail.getSummary(), detail.getOtherSubjCode(),
                detail.getVouchDetailId());
    }

    public void deleteById(Long vouchDetailId) {
        jdbcTemplate.update("DELETE FROM acct_vouch_detail WHERE vouch_detail_id = ?", vouchDetailId);
    }

    public void deleteByVouchId(Long vouchId) {
        jdbcTemplate.update("DELETE FROM acct_vouch_detail WHERE vouch_id = ?", vouchId);
    }

    public List<AcctVouchDetail> findByVouchId(Long vouchId) {
        String sql = "SELECT * FROM acct_vouch_detail WHERE vouch_id = ? ORDER BY vouch_page, vouch_row";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouchDetail.class), vouchId);
    }
}
