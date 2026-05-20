package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctVouchDraft;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class VouchDraftRepository {

    private final JdbcTemplate jdbcTemplate;

    public VouchDraftRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Integer insert(AcctVouchDraft draft) {
        String sql = """
            INSERT INTO acct_vouch_draft (
                comp_code, copy_code, acct_year, acct_month, vouch_no,
                vouch_date, vouch_bill_num, vouch_type_id, vouch_source_code,
                operator, acc_manager, auditor, poster, is_check, is_acc,
                is_cx, is_cancel, is_error, errorer,
                teller, is_tell, is_chknot, modifier, templet_id,
                print_num, is_auto, type_attr, rela_vouch_id,
                vouch_remark, is_templet, group_name,
                extend1_vouch_no, extend2_vouch_no
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(new PreparedStatementCreator() {
            @Override
            public PreparedStatement createPreparedStatement(Connection con) throws SQLException {
                PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                int idx = 1;
                ps.setString(idx++, draft.getCompCode());
                ps.setString(idx++, draft.getCopyCode());
                ps.setString(idx++, draft.getAcctYear());
                ps.setString(idx++, draft.getAcctMonth());
                ps.setObject(idx++, draft.getVouchNo());
                ps.setObject(idx++, draft.getVouchDate() != null ? Timestamp.valueOf(draft.getVouchDate()) : null);
                ps.setObject(idx++, draft.getVouchBillNum());
                ps.setObject(idx++, draft.getVouchTypeId());
                ps.setString(idx++, draft.getVouchSourceCode() != null ? draft.getVouchSourceCode() : "01");
                ps.setString(idx++, draft.getOperator());
                ps.setString(idx++, draft.getAccManager());
                ps.setString(idx++, draft.getAuditor());
                ps.setString(idx++, draft.getPoster());
                ps.setString(idx++, draft.getIsCheck() != null ? draft.getIsCheck() : "0");
                ps.setString(idx++, draft.getIsAcc() != null ? draft.getIsAcc() : "0");
                ps.setString(idx++, draft.getIsCx() != null ? draft.getIsCx() : "0");
                ps.setString(idx++, draft.getIsCancel() != null ? draft.getIsCancel() : "0");
                ps.setString(idx++, draft.getIsError() != null ? draft.getIsError() : "0");
                ps.setString(idx++, draft.getErrorer());
                ps.setString(idx++, draft.getTeller());
                ps.setString(idx++, draft.getIsTell() != null ? draft.getIsTell() : "0");
                ps.setString(idx++, draft.getIsChknot() != null ? draft.getIsChknot() : "0");
                ps.setString(idx++, draft.getModifier());
                ps.setObject(idx++, draft.getTempletId());
                ps.setObject(idx++, draft.getPrintNum() != null ? draft.getPrintNum() : 0);
                ps.setObject(idx++, draft.getIsAuto() != null ? draft.getIsAuto() : 0);
                ps.setObject(idx++, draft.getTypeAttr() != null ? draft.getTypeAttr() : 0);
                ps.setObject(idx++, draft.getRelaVouchId());
                ps.setString(idx++, draft.getVouchRemark());
                ps.setString(idx++, draft.getIsTemplet() != null ? draft.getIsTemplet() : "0");
                ps.setString(idx++, draft.getGroupName() != null ? draft.getGroupName() : "\u9ed8\u8ba4\u5206\u7ec4");
                ps.setString(idx++, draft.getExtend1VouchNo());
                ps.setString(idx++, draft.getExtend2VouchNo());
                return ps;
            }
        }, keyHolder);

        Number key = keyHolder.getKey();
        return Objects.requireNonNull(key, "Cannot retrieve auto-generated vouch_id after INSERT").intValue();
    }

    /**
     * @deprecated Use {@link #insert(AcctVouchDraft)} which returns the generated ID directly.
     */
    @Deprecated
    public Integer getLastInsertId() {
        return jdbcTemplate.queryForObject("SELECT CAST(SCOPE_IDENTITY() AS INT)", Integer.class);
    }

    public void update(AcctVouchDraft draft) {
        String sql = """
            UPDATE acct_vouch_draft SET
                vouch_remark = ?,
                vouch_date = ?, vouch_bill_num = ?, vouch_type_id = ?,
                vouch_source_code = ?, operator = ?, acc_manager = ?,
                auditor = ?, poster = ?,
                modifier = ?, teller = ?
            WHERE vouch_id = ?
            """;
        jdbcTemplate.update(sql,
                draft.getVouchRemark(),
                draft.getVouchDate() != null ? Timestamp.valueOf(draft.getVouchDate()) : null,
                draft.getVouchBillNum(), draft.getVouchTypeId(),
                draft.getVouchSourceCode(), draft.getOperator(),
                draft.getAccManager(), draft.getAuditor(), draft.getPoster(),
                draft.getModifier(), draft.getTeller(),
                draft.getVouchId());
    }

    public Optional<AcctVouchDraft> findById(Integer vouchId) {
        String sql = "SELECT * FROM acct_vouch_draft WHERE vouch_id = ?";
        List<AcctVouchDraft> results = jdbcTemplate.query(sql,
                new BeanPropertyRowMapper<>(AcctVouchDraft.class), vouchId);
        return results.stream().findFirst();
    }

    public List<AcctVouchDraft> findAll() {
        String sql = "SELECT * FROM acct_vouch_draft ORDER BY c_time DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctVouchDraft.class));
    }

    public void deleteById(Integer vouchId) {
        jdbcTemplate.update("DELETE FROM acct_vouch_draft WHERE vouch_id = ?", vouchId);
    }
}
