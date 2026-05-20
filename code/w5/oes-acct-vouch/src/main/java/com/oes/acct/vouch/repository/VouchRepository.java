package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctVouch;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class VouchRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(AcctVouch vouch) {
        String sql = """
            INSERT INTO acct_vouch (
                vouch_id, comp_code, copy_code, acct_year, acct_month, vouch_no,
                vouch_date, vouch_bill_num, vouch_type_id, vouch_source_code,
                operator, acc_manager, modifier, teller, is_check, is_acc,
                is_cancel, is_cx, is_error, print_num, type_attr, is_tell, is_chknot,
                is_czbksr
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
                vouch.getVouchId(),
                vouch.getCompCode(),
                vouch.getCopyCode(),
                vouch.getAcctYear(),
                vouch.getAcctMonth(),
                vouch.getVouchNo(),
                vouch.getVouchDate() != null ? Timestamp.valueOf(vouch.getVouchDate()) : null,
                vouch.getVouchBillNum(),
                vouch.getVouchTypeId(),
                vouch.getVouchSourceCode() != null ? vouch.getVouchSourceCode() : "01",
                vouch.getOperator(),
                vouch.getAccManager(),
                vouch.getModifier(),
                vouch.getTeller(),
                vouch.getIsCheck() != null ? vouch.getIsCheck() : "0",
                vouch.getIsAcc() != null ? vouch.getIsAcc() : "0",
                vouch.getIsCancel() != null ? vouch.getIsCancel() : "0",
                vouch.getIsCx() != null ? vouch.getIsCx() : "0",
                vouch.getIsError() != null ? vouch.getIsError() : "0",
                vouch.getPrintNum() != null ? vouch.getPrintNum() : 0,
                vouch.getTypeAttr() != null ? vouch.getTypeAttr() : 0,
                vouch.getIsTell() != null ? vouch.getIsTell() : "0",
                vouch.getIsChknot() != null ? vouch.getIsChknot() : "0",
                vouch.getIsCzbksr() != null ? vouch.getIsCzbksr() : 0);
    }

    public void update(AcctVouch vouch) {
        String sql = """
            UPDATE acct_vouch SET
                vouch_date = ?, vouch_bill_num = ?, vouch_type_id = ?,
                vouch_source_code = ?, operator = ?, acc_manager = ?,
                modifier = ?, teller = ?
            WHERE vouch_id = ?
            """;
        jdbcTemplate.update(sql,
                vouch.getVouchDate() != null ? Timestamp.valueOf(vouch.getVouchDate()) : null,
                vouch.getVouchBillNum(), vouch.getVouchTypeId(),
                vouch.getVouchSourceCode(), vouch.getOperator(),
                vouch.getAccManager(), vouch.getModifier(), vouch.getTeller(),
                vouch.getVouchId());
    }

    public Optional<AcctVouch> findById(Long vouchId) {
        String sql = "SELECT * FROM acct_vouch WHERE vouch_id = ?";
        List<AcctVouch> results = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouch.class), vouchId);
        return results.stream().findFirst();
    }

    public Optional<Integer> findMaxVouchNo(String compCode, String copyCode, String acctYear, String acctMonth) {
        String sql = """
            SELECT ISNULL(MAX(vouch_no), 0) FROM acct_vouch
            WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?
            """;
        Integer maxNo = jdbcTemplate.queryForObject(sql, Integer.class, compCode, copyCode, acctYear, acctMonth);
        return Optional.ofNullable(maxNo);
    }

    public List<AcctVouch> findByPeriod(String compCode, String copyCode, String acctYear, String acctMonth,
                                          Long lastVouchId, Integer lastVouchNo, String direction, int limit) {
        String operator;
        Object[] params;
        String sql;

        if ("prev".equals(direction)) {
            sql = """
                SELECT TOP (?) * FROM acct_vouch
                WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?
                AND (vouch_no < ? OR (vouch_no = ? AND vouch_id < ?))
                AND is_cancel = '0'
                ORDER BY vouch_no DESC, vouch_id DESC
                """;
            params = new Object[]{limit, compCode, copyCode, acctYear, acctMonth,
                    lastVouchNo, lastVouchNo, lastVouchId};
        } else {
            sql = """
                SELECT TOP (?) * FROM acct_vouch
                WHERE comp_code = ? AND copy_code = ? AND acct_year = ? AND acct_month = ?
                AND (vouch_no > ? OR (vouch_no = ? AND vouch_id > ?))
                AND is_cancel = '0'
                ORDER BY vouch_no ASC, vouch_id ASC
                """;
            params = new Object[]{limit, compCode, copyCode, acctYear, acctMonth,
                    lastVouchNo, lastVouchNo, lastVouchId};
        }
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouch.class), params);
    }

    public void updateAudit(Long vouchId, String auditor, String isCheck) {
        String sql = "UPDATE acct_vouch SET auditor = ?, is_check = ? WHERE vouch_id = ?";
        jdbcTemplate.update(sql, auditor, isCheck, vouchId);
    }
}
