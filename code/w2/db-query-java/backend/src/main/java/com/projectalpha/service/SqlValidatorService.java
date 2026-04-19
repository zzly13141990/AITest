package com.projectalpha.service;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Top;
import net.sf.jsqlparser.expression.LongValue;
import org.springframework.stereotype.Service;

@Service
public class SqlValidatorService {
    
    public boolean isValidSelectStatement(String sql) {
        try {
            Statement statement = CCJSqlParserUtil.parse(sql);
            return statement instanceof Select;
        } catch (JSQLParserException e) {
            return false;
        }
    }
    
    public String validateAndEnhanceSql(String sql) {
        // 支持所有类型的SQL语句，对于SELECT语句添加top/limit子句
        if (isValidSelectStatement(sql)) {
            return addLimitClauseIfNeeded(sql);
        }
        // 对于非SELECT语句，直接返回
        return sql;
    }
    
    public String addLimitClauseIfNeeded(String sql) {
        try {
            Statement statement = CCJSqlParserUtil.parse(sql);
            if (statement instanceof Select) {
                // 简单实现：检查是否包含TOP或LIMIT子句
                if (!sql.toLowerCase().contains("top ") && !sql.toLowerCase().contains("limit ")) {
                    // 对于SQL Server，在SELECT后添加TOP子句
                    return sql.replaceFirst("(?i)SELECT", "SELECT TOP 1000");
                }
            }
            return sql;
        } catch (JSQLParserException e) {
            throw new IllegalArgumentException("Invalid SQL: " + e.getMessage());
        }
    }
}