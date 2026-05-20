package com.etyy.querytool.security;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.select.SelectBody;
import net.sf.jsqlparser.statement.select.SetOperationList;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

public class SqlParserWrapper {

    private static final Pattern SELECT_PREFIX = Pattern.compile(
            "^\\s*SELECT\\b", Pattern.CASE_INSENSITIVE);

    private static final Set<String> DANGEROUS_KEYWORDS = new HashSet<>(Arrays.asList(
            "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "TRUNCATE TABLE",
            "CREATE INDEX", "DROP INDEX",
            "INSERT", "UPDATE", "DELETE", "REPLACE", "MERGE",
            "EXEC", "EXECUTE", "CALL",
            "CREATE PROCEDURE", "CREATE FUNCTION",
            "INTO OUTFILE", "INTO DUMPFILE", "LOAD DATA", "LOAD FILE",
            "xp_cmdshell", "xp_exec", "sys_exec", "sp_configure",
            "CREATE LINK",
            "GRANT", "REVOKE", "CREATE USER", "ALTER USER"
    ));

    public static boolean startsWithSelect(String sql) {
        return SELECT_PREFIX.matcher(sql).find();
    }

    public static Select parseAsSelect(String sql) throws JSQLParserException {
        Statement statement = CCJSqlParserUtil.parse(sql);
        if (!(statement instanceof Select)) {
            throw new JSQLParserException("Not a SELECT statement");
        }
        return (Select) statement;
    }

    public static boolean hasOuterOrderBy(Select select) {
        SelectBody body = select.getSelectBody();
        if (body instanceof PlainSelect) {
            PlainSelect plainSelect = (PlainSelect) body;
            return plainSelect.getOrderByElements() != null
                    && !plainSelect.getOrderByElements().isEmpty();
        }
        // UNION / INTERSECT / EXCEPT queries cannot be paginated reliably
        return false;
    }

    public static boolean containsDangerousKeywords(String sql) {
        String upper = sql.toUpperCase();
        // Remove string literals to avoid false positives
        String noStrings = upper.replaceAll("'[^']*'", "");
        for (String keyword : DANGEROUS_KEYWORDS) {
            if (noStrings.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    public static String stripOuterOrderBy(String sql) throws JSQLParserException {
        Select select = parseAsSelect(sql);
        SelectBody body = select.getSelectBody();
        if (body instanceof PlainSelect) {
            PlainSelect plainSelect = (PlainSelect) body;
            plainSelect.setOrderByElements(null);
            return select.toString();
        }
        // SetOperationList or other — cannot strip ORDER BY, return as-is
        return sql;
    }
}
