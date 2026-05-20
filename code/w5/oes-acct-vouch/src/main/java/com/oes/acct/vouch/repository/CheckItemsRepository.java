package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctCheckItem;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@Repository
public class CheckItemsRepository {

    private final JdbcTemplate jdbcTemplate;

    public CheckItemsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Batch insert check items with dynamic checktype columns.
     * PRD §4.6: checktype{N} N = sys_check_define.check_id.
     * Only includes columns that actually have values in the batch.
     */
    public void batchInsert(List<AcctCheckItem> items) {
        if (items.isEmpty()) return;

        // Determine which checktype columns have values across all items
        Set<Integer> checkColumns = new TreeSet<>();
        for (AcctCheckItem item : items) {
            for (int i = 1; i <= 50; i++) {
                if (item.getChecktype(i) != null) {
                    checkColumns.add(i);
                }
            }
        }

        // Build dynamic SQL
        StringBuilder colBuilder = new StringBuilder(
            "vouch_detail_id, vouch_id, line, comp_code, copy_code, " +
            "acct_year, acct_subj_code, summary, amt_debit, amt_credit");
        StringBuilder valBuilder = new StringBuilder("?, ?, ?, ?, ?, ?, ?, ?, ?, ?");

        for (int cid : checkColumns) {
            colBuilder.append(", checktype").append(cid);
            valBuilder.append(", ?");
        }

        // Standard columns always included
        colBuilder.append(", info_fzhs1, info_fzhs2, info_fzhs3, info_fzhs4, info_fzhs5");
        colBuilder.append(", order_no, order_date, pay_type_id, cheq_no, receipt_no, occur_date");
        colBuilder.append(", vouch_no, vouch_date, vouch_row, exch_rate, amt_debit_f, amt_credit_f, is_init");
        for (int i = 0; i < 18; i++) valBuilder.append(", ?");

        String sql = "INSERT INTO acct_check_items (" + colBuilder + ") VALUES (" + valBuilder + ")";

        final Set<Integer> cols = checkColumns;
        jdbcTemplate.batchUpdate(sql, items, items.size(), (ps, item) -> {
            int idx = 1;
            ps.setObject(idx++, item.getVouchDetailId());
            ps.setObject(idx++, item.getVouchId());
            ps.setObject(idx++, item.getLine());
            ps.setString(idx++, item.getCompCode());
            ps.setString(idx++, item.getCopyCode());
            ps.setString(idx++, item.getAcctYear());
            ps.setString(idx++, item.getAcctSubjCode());
            ps.setString(idx++, item.getSummary());
            ps.setBigDecimal(idx++, item.getAmtDebit()==null?BigDecimal.ZERO:item.getAmtDebit());
            ps.setBigDecimal(idx++, item.getAmtCredit()==null?BigDecimal.ZERO:item.getAmtCredit());

            for (int cid : cols) ps.setObject(idx++, item.getChecktype(cid));
            ps.setString(idx++, item.getInfoFzhs1());
            ps.setString(idx++, item.getInfoFzhs2());
            ps.setString(idx++, item.getInfoFzhs3());
            ps.setString(idx++, item.getInfoFzhs4());
            ps.setString(idx++, item.getInfoFzhs5());
            ps.setString(idx++, item.getOrderNo());
            ps.setObject(idx++, item.getOrderDate() != null ? java.sql.Date.valueOf(item.getOrderDate()) : null);
            ps.setObject(idx++, item.getPayTypeId());
            ps.setString(idx++, item.getCheqNo());
            ps.setString(idx++, item.getReceiptNo());
            ps.setString(idx++, item.getOccurDate());
            ps.setObject(idx++, item.getVouchNo());
            ps.setObject(idx++, item.getVouchDate() != null ? java.sql.Timestamp.valueOf(item.getVouchDate()) : null);
            ps.setObject(idx++, item.getVouchRow());
            ps.setBigDecimal(idx++, item.getExchRate() != null ? new java.math.BigDecimal(item.getExchRate()) : new java.math.BigDecimal("1.000000"));
            ps.setBigDecimal(idx++, item.getAmtDebitF() != null ? item.getAmtDebitF() : java.math.BigDecimal.ZERO);
            ps.setBigDecimal(idx++, item.getAmtCreditF() != null ? item.getAmtCreditF() : java.math.BigDecimal.ZERO);
            ps.setString(idx++, item.getIsInit());
        });
    }

    public void deleteByDetailId(Long vouchDetailId) {
        jdbcTemplate.update("DELETE FROM acct_check_items WHERE vouch_detail_id = ?", vouchDetailId);
    }

    public void deleteByVouchId(Long vouchId) {
        jdbcTemplate.update("DELETE FROM acct_check_items WHERE vouch_id = ?", vouchId);
    }

    public List<AcctCheckItem> findByDetailId(Long vouchDetailId) {
        String sql = "SELECT * FROM acct_check_items WHERE vouch_detail_id = ? ORDER BY line";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctCheckItem.class), vouchDetailId);
    }

    public List<AcctCheckItem> findByVouchId(Long vouchId) {
        String sql = "SELECT * FROM acct_check_items WHERE vouch_id = ? ORDER BY vouch_detail_id, line";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctCheckItem.class), vouchId);
    }
}
