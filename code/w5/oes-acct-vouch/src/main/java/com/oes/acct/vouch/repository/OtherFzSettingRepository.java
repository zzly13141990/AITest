package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctSubjOtherFzSetting;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class OtherFzSettingRepository {

    private final JdbcTemplate jdbcTemplate;

    public OtherFzSettingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AcctSubjOtherFzSetting> findBySubject(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        String sql = """
            SELECT * FROM acct_subj_other_fz_setting
            WHERE acct_subj_code = ? AND comp_code = ? AND copy_code = ? AND acct_year = ?
            ORDER BY other_fzhs_idx
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctSubjOtherFzSetting.class),
                acctSubjCode, compCode, copyCode, acctYear);
    }

    public List<AcctSubjOtherFzSetting> findVisibleBySubject(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        String sql = """
            SELECT * FROM acct_subj_other_fz_setting
            WHERE acct_subj_code = ? AND comp_code = ? AND copy_code = ? AND acct_year = ?
            AND is_show = 1
            ORDER BY other_fzhs_idx
            """;
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(AcctSubjOtherFzSetting.class),
                acctSubjCode, compCode, copyCode, acctYear);
    }
}
