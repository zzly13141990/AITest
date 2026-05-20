package com.etyy.querytool.service;

import com.etyy.querytool.security.SqlParserWrapper;
import net.sf.jsqlparser.JSQLParserException;
import org.springframework.stereotype.Service;

@Service
public class PageService {

    /**
     * Build a paginated SQL for the given database type.
     */
    public String buildPageSql(String sql, int pageNumber, int pageSize, String dbType) {
        int offset = (pageNumber - 1) * pageSize;
        switch (dbType.toLowerCase()) {
            case "mysql":
                return sql + " LIMIT " + pageSize + " OFFSET " + offset;
            case "sqlserver":
                return sql + " OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
            case "oracle":
                return sql + " OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + dbType);
        }
    }

    /**
     * Build a COUNT query wrapping the original SQL.
     */
    public String buildCountSql(String sql) {
        try {
            String noOrderBy = SqlParserWrapper.stripOuterOrderBy(sql);
            return "SELECT COUNT(*) FROM (" + noOrderBy + ") AS cnt";
        } catch (JSQLParserException e) {
            // Fallback: wrap without stripping ORDER BY
            return "SELECT COUNT(*) FROM (" + sql + ") AS cnt";
        }
    }
}
