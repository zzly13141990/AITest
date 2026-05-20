package com.oes.acct.vouch.repository;

import com.oes.acct.vouch.model.entity.AcctYearPeriod;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class YearPeriodRepository {

    private final JdbcTemplate jdbcTemplate;

    public YearPeriodRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Find the accounting period that contains the given date.
     * The date must fall within [begin_date, end_date] range.
     */
    public Optional<AcctYearPeriod> findByDate(String compCode, String copyCode, LocalDate date) {
        String sql = """
            SELECT * FROM acct_year_period
            WHERE comp_code = ? AND copy_code = ?
              AND begin_date <= ? AND end_date >= ?
            ORDER BY acct_year, acct_month
            """;
        List<AcctYearPeriod> results = jdbcTemplate.query(
                sql,
                new BeanPropertyRowMapper<>(AcctYearPeriod.class),
                compCode, copyCode, Date.valueOf(date), Date.valueOf(date));
        return results.stream().findFirst();
    }
}
