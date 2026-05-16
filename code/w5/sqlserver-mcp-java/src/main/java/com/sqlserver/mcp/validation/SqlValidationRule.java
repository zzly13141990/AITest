package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;

import java.util.Optional;

@FunctionalInterface
public interface SqlValidationRule {
    Optional<ValidationResult> check(String sql, DatabaseSchema schema);
}
