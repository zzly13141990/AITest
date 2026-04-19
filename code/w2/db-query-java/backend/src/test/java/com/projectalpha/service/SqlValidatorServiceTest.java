package com.projectalpha.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SqlValidatorServiceTest {
    
    private SqlValidatorService sqlValidatorService;
    
    @BeforeEach
    void setUp() {
        sqlValidatorService = new SqlValidatorService();
    }
    
    @Test
    void testIsValidSelectStatement() {
        // 测试有效的SELECT语句
        String validSelect = "SELECT * FROM users";
        assertTrue(sqlValidatorService.isValidSelectStatement(validSelect));
        
        // 测试无效的非SELECT语句
        String invalidInsert = "INSERT INTO users (name) VALUES ('John')";
        assertFalse(sqlValidatorService.isValidSelectStatement(invalidInsert));
        
        // 测试无效的SQL语法
        String invalidSyntax = "SELECT * FROM";
        assertFalse(sqlValidatorService.isValidSelectStatement(invalidSyntax));
    }
    
    @Test
    void testValidateAndEnhanceSql() {
        // 测试有效的SELECT语句，应该添加TOP子句
        String sql = "SELECT * FROM users";
        String result = sqlValidatorService.validateAndEnhanceSql(sql);
        assertTrue(result.contains("TOP 1000"));
        
        // 测试已经包含TOP子句的语句，不应该添加
        String sqlWithTop = "SELECT TOP 50 * FROM users";
        String resultWithTop = sqlValidatorService.validateAndEnhanceSql(sqlWithTop);
        assertEquals(sqlWithTop, resultWithTop);
        
        // 测试非SELECT语句，应该抛出异常
        String nonSelectSql = "INSERT INTO users (name) VALUES ('John')";
        assertThrows(IllegalArgumentException.class, () -> {
            sqlValidatorService.validateAndEnhanceSql(nonSelectSql);
        });
    }
    
    @Test
    void testAddLimitClauseIfNeeded() {
        // 测试需要添加TOP子句的情况
        String sql = "SELECT * FROM users";
        String result = sqlValidatorService.addLimitClauseIfNeeded(sql);
        assertTrue(result.contains("TOP 1000"));
        
        // 测试已经包含TOP子句的情况
        String sqlWithTop = "SELECT TOP 50 * FROM users";
        String resultWithTop = sqlValidatorService.addLimitClauseIfNeeded(sqlWithTop);
        assertEquals(sqlWithTop, resultWithTop);
        
        // 测试无效SQL，应该抛出异常
        String invalidSql = "SELECT * FROM";
        assertThrows(IllegalArgumentException.class, () -> {
            sqlValidatorService.addLimitClauseIfNeeded(invalidSql);
        });
    }
}
