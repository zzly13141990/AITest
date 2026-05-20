package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctVouchDetailDraft;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VouchDetailDraftRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchDetailDraftRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(AcctVouchDetailDraft detail) {
        String sql = """
            INSERT INTO acct_vouch_detail_draft (
                vouch_id, vouch_page, vouch_row, summary, comp_code, copy_code,
                acct_year, acct_subj_code, amt_debit, amt_credit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
                detail.getVouchId(),
                detail.getVouchPage(),
                detail.getVouchRow(),
                detail.getSummary(),
                detail.getCompCode(),
                detail.getCopyCode(),
                detail.getAcctYear(),
                detail.getAcctSubjCode(),
                detail.getAmtDebit(),
                detail.getAmtCredit());
    }

    public Long getLastInsertId() {
        return jdbcTemplate.queryForObject("SELECT CAST(SCOPE_IDENTITY() AS BIGINT)", Long.class);
    }

    public void update(AcctVouchDetailDraft detail) {
        String sql = """
            UPDATE acct_vouch_detail_draft SET
                acct_subj_code = ?, amt_debit = ?, amt_credit = ?,
                summary = ?
            WHERE vouch_detail_id = ?
            """;
        jdbcTemplate.update(sql,
                detail.getAcctSubjCode(), detail.getAmtDebit(), detail.getAmtCredit(),
                detail.getSummary(),
                detail.getVouchDetailId());
    }

    public void deleteByVouchId(Long vouchId) {
        jdbcTemplate.update("DELETE FROM acct_vouch_detail_draft WHERE vouch_id = ?", vouchId);
    }

    public List<AcctVouchDetailDraft> findByVouchId(Long vouchId) {
        String sql = "SELECT * FROM acct_vouch_detail_draft WHERE vouch_id = ? ORDER BY vouch_page, vouch_row";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouchDetailDraft.class), vouchId);
    }
}
