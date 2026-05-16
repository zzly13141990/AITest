package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.model.schema.DatabaseSchema;

import java.util.Optional;

public class ResultMeaningValidator implements SqlValidationRule {
    // Placeholder for LLM-based result meaning validation
    // This validator is feature-gated behind QueryConfig.Features.resultMeaningValidation

    public ResultMeaningValidator() {
        // No-op: LLM client integration would be added here when the feature is enabled
    }

    @Override
    public Optional<ValidationResult> check(String sql, DatabaseSchema schema) {
        // Currently a pass-through — always returns success
        // When enabled, this validator would use an LLM client to check:
        // 1. Whether the SQL semantics match the user's intent
        // 2. Whether the result set is likely meaningful
        // 3. Whether the query is efficient (index usage, join order)
        return Optional.empty();
    }
}
