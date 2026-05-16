package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Table;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.alter.Alter;
import net.sf.jsqlparser.statement.comment.Comment;
import net.sf.jsqlparser.statement.create.index.CreateIndex;
import net.sf.jsqlparser.statement.create.table.CreateTable;
import net.sf.jsqlparser.statement.create.view.CreateView;
import net.sf.jsqlparser.statement.delete.Delete;
import net.sf.jsqlparser.statement.drop.Drop;
import net.sf.jsqlparser.statement.execute.Execute;
import net.sf.jsqlparser.statement.grant.Grant;
import net.sf.jsqlparser.statement.insert.Insert;
import net.sf.jsqlparser.statement.merge.Merge;
import net.sf.jsqlparser.statement.select.FromItem;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.select.SetOperationList;
import net.sf.jsqlparser.statement.truncate.Truncate;
import net.sf.jsqlparser.statement.update.Update;
import net.sf.jsqlparser.statement.upsert.Upsert;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class SqlAstValidator implements SqlValidationRule {
    private static final Logger log = LoggerFactory.getLogger(SqlAstValidator.class);

    @Override
    public Optional<ValidationResult> check(String sql, DatabaseSchema schema) {
        try {
            var statement = CCJSqlParserUtil.parse(sql);
            return validateStatement(statement, schema);
        } catch (JSQLParserException e) {
            log.debug("JSqlParser could not parse SQL (T-SQL syntax?), downgrading to L3: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<ValidationResult> validateStatement(Statement statement, DatabaseSchema schema) {
        // Select statements: verify referenced tables exist in schema
        if (statement instanceof Select select) {
            return validateSelectTables(select, schema);
        }

        // Reject all mutation/DDL/DCL statements
        return switch (statement) {
            case Insert ignored -> reject("INSERT");
            case Update ignored -> reject("UPDATE");
            case Delete ignored -> reject("DELETE");
            case Merge ignored -> reject("MERGE");
            case CreateTable ignored -> reject("CREATE");
            case CreateView ignored -> reject("CREATE");
            case CreateIndex ignored -> reject("CREATE");
            case Alter ignored -> reject("ALTER");
            case Drop ignored -> reject("DROP");
            case Truncate ignored -> reject("TRUNCATE");
            case Execute ignored -> reject("EXECUTE");
            case Grant ignored -> reject("GRANT");
            case Upsert ignored -> reject("UPSERT");
            case Comment ignored -> reject("COMMENT");
            default -> {
                log.debug("Unknown JSqlParser statement type: {}, allowing downgrade to L3", statement.getClass().getSimpleName());
                yield Optional.empty();
            }
        };
    }

    private Optional<ValidationResult> validateSelectTables(Select select, DatabaseSchema schema) {
        if (schema.tables().isEmpty()) {
            return Optional.empty();
        }
        var tableNames = extractTableNames(select);
        for (var name : tableNames) {
            if (!schema.tables().containsKey(name)) {
                log.warn("Table '{}' referenced in query but not found in schema", name);
                return Optional.of(ValidationResult.reject(
                    "SCHEMA_ERROR",
                    "Table '" + name + "' not found in database schema",
                    "Check the table name, available tables: " + String.join(", ", schema.tables().keySet()),
                    Map.of("table", name, "validator", "SqlAstValidator")
                ));
            }
        }
        return Optional.empty();
    }

    private static List<String> extractTableNames(Select select) {
        var tables = new ArrayList<String>();
        var body = select.getSelectBody();
        if (body instanceof PlainSelect ps) {
            addTableName(ps.getFromItem(), tables);
            if (ps.getJoins() != null) {
                ps.getJoins().forEach(j -> addTableName(j.getRightItem(), tables));
            }
        } else if (body instanceof SetOperationList sol) {
            sol.getSelects().forEach(s -> {
                if (s instanceof Select subSelect) {
                    tables.addAll(extractTableNames(subSelect));
                }
            });
        }
        return tables;
    }

    private static void addTableName(FromItem item, List<String> tables) {
        if (item instanceof Table table) {
            tables.add(table.getName());
        } else if (item instanceof net.sf.jsqlparser.statement.select.Select subSelect) {
            tables.addAll(extractTableNames(subSelect));
        }
    }

    private static Optional<ValidationResult> reject(String statementType) {
        return Optional.of(ValidationResult.reject(
            "READ_ONLY_VIOLATION",
            "Read-only violation: " + statementType + " statement is not allowed",
            "Only SELECT and WITH statements are allowed",
            Map.of("statementType", statementType, "validator", "SqlAstValidator")
        ));
    }
}
