package com.oes.acct.vouch.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class WhereSqlTemplateTest {

    @Test
    void resolve_withNull_shouldReturnDefault() {
        assertEquals(WhereSqlTemplate.DEFAULT, WhereSqlTemplate.resolve(null));
    }

    @Test
    void resolve_withEmpty_shouldReturnDefault() {
        assertEquals(WhereSqlTemplate.DEFAULT, WhereSqlTemplate.resolve("  "));
    }

    @Test
    void resolve_withCompCodeYear_shouldReturnByCompCopyYear() {
        String sql = "comp_code = :compCode AND copy_code = :copyCode AND acct_year = :acctYear";
        assertEquals(WhereSqlTemplate.BY_COMP_COPY_YEAR, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withCompAndCopy_shouldReturnByCompCopy() {
        String sql = "comp_code = :compCode AND copy_code = :copyCode";
        assertEquals(WhereSqlTemplate.BY_COMP_COPY, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withCompOnly_shouldReturnByComp() {
        String sql = "comp_code = :compCode";
        assertEquals(WhereSqlTemplate.BY_COMP, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withIsStop_shouldReturnByStandard() {
        String sql = "is_stop = '0'";
        assertEquals(WhereSqlTemplate.BY_STANDARD, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withMixedCase_shouldNormalizeBeforeResolve() {
        String sql = "COMP_CODE = :compCode AND COPY_CODE = :copyCode AND ACCT_YEAR = :acctYear";
        assertEquals(WhereSqlTemplate.BY_COMP_COPY_YEAR, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withExtraSpaces_shouldNormalize() {
        String sql = "  comp_code  =  :compCode  AND  copy_code  =  :copyCode  ";
        assertEquals(WhereSqlTemplate.BY_COMP_COPY, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withUnrecognized_shouldReturnDefault() {
        assertEquals(WhereSqlTemplate.DEFAULT, WhereSqlTemplate.resolve("some_unknown_column = ?"));
    }

    @Test
    void template_shouldContainCorrectPlaceholders() {
        assertEquals("1=1", WhereSqlTemplate.DEFAULT.getTemplate());
        assertEquals("comp_code = ?", WhereSqlTemplate.BY_COMP.getTemplate());
        assertEquals("comp_code = ? AND copy_code = ?", WhereSqlTemplate.BY_COMP_COPY.getTemplate());
    }

    @Test
    void getParameterIndex_shouldMapCorrectIndices() {
        assertEquals(1, WhereSqlTemplate.BY_COMP.getParameterIndex().get("compCode").intValue());
        assertEquals(2, WhereSqlTemplate.BY_COMP_COPY.getParameterIndex().get("copyCode").intValue());
    }

    @Test
    void resolve_withEmbeddedCompCode_shouldNotMatchByComp() {
        // :compCode is only a substring, not the full template — should NOT match
        String sql = "some_column LIKE '%' + :compCode + '%'";
        assertEquals(WhereSqlTemplate.DEFAULT, WhereSqlTemplate.resolve(sql));
    }

    @Test
    void resolve_withInjectionAttempt_shouldNotMatch() {
        // Injection attempt: malicious content alongside valid placeholders
        String sql = "comp_code = :compCode; DROP TABLE sys_dept --";
        assertEquals(WhereSqlTemplate.DEFAULT, WhereSqlTemplate.resolve(sql));
    }
}
