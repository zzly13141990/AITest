package com.etyy.querytool.service;

import com.etyy.querytool.model.dto.PageParam;
import com.etyy.querytool.security.SqlValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("SqlValidator Unit Tests")
class SqlValidatorTest {

    private final SqlValidator validator = new SqlValidator();

    @ParameterizedTest
    @CsvSource({
        "'SELECT * FROM users ORDER BY id',     'true',  ''",
        "'SELECT * FROM users',                  'false', ''",
        "'SELECT * FROM users',                  'true',  '使用分页查询时 SQL 必须包含 ORDER BY 子句'",
        "'DROP TABLE users',                     'false', '仅允许 SELECT 查询语句'",
        "'DELETE FROM users',                    'false', '仅允许 SELECT 查询语句'",
        "'INSERT INTO users VALUES(1)',          'false', '仅允许 SELECT 查询语句'",
        "'SELECT * FROM users; DROP TABLE users','false', 'SQL 包含被禁止的操作'",
        "'EXEC xp_cmdshell(''whoami'')',         'false', '仅允许 SELECT 查询语句'",
        "'GRANT ALL ON *.* TO h',                'false', '仅允许 SELECT 查询语句'",
        "'  SELECT * FROM account ORDER BY id',  'true',  ''",
        "'select * from account order by id',    'true',  ''",
    })
    @DisplayName("SQL validation scenarios")
    void testValidation(String sql, String hasPage, String expectedError) {
        PageParam page = "true".equals(hasPage) ? new PageParam() : null;
        String result = validator.validate(sql, page);
        if (expectedError.isEmpty()) {
            assertNull(result, "Expected valid SQL: " + sql);
        } else {
            assertTrue(result != null && result.contains(expectedError),
                    "Expected error containing: '" + expectedError + "'. Got: " + result);
        }
    }

    @Test
    @DisplayName("Null SQL should return error")
    void testNullSql() {
        assertNotNull(validator.validate(null, null));
    }

    @Test
    @DisplayName("Empty SQL should return error")
    void testEmptySql() {
        assertNotNull(validator.validate("", null));
    }
}
