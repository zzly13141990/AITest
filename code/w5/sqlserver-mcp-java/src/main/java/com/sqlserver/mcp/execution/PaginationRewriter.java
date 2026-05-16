package com.sqlserver.mcp.execution;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.select.Select;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.stream.Collectors;

public class PaginationRewriter {
    private static final Logger log = LoggerFactory.getLogger(PaginationRewriter.class);

    public RewrittenSql rewrite(String originalSql, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var offset = (page - 1L) * pageSize;
        var trimmed = originalSql.strip().trim();

        var countSql = "SELECT COUNT(*) AS cnt FROM (" + trimmed + ") AS _cnt";

        var orderClause = extractOrderBy(trimmed);
        var pageSql = "SELECT * FROM (" + trimmed + ") AS _p " + orderClause
            + " OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";

        return new RewrittenSql(countSql, pageSql);
    }

    private static String extractOrderBy(String sql) {
        try {
            var statement = CCJSqlParserUtil.parse(sql);
            if (statement instanceof Select select && select.getSelectBody() != null) {
                var orderBy = select.getOrderByElements();
                if (orderBy != null && !orderBy.isEmpty()) {
                    var orderStr = orderBy.stream()
                        .map(Object::toString)
                        .collect(Collectors.joining(", "));
                    return "ORDER BY " + orderStr;
                }
            }
        } catch (JSQLParserException e) {
            log.debug("Could not parse SQL for ORDER BY extraction: {}", e.getMessage());
        }
        return "ORDER BY (SELECT NULL)";
    }

    public record RewrittenSql(String countSql, String pageSql) {}
}
