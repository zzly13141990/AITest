package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.schema.SchemaProvider;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ValidationChainBuilder {

    private final ConnectionPoolManager poolManager;
    private final LlmClient llmClient;
    private final SchemaProvider schemaProvider;
    private final AppConfig.QueryConfig queryConfig;

    public record ValidationChain(
        List<SqlValidationRule> rules,
        Optional<ParseOnlyValidator> parseOnlyValidator,
        Optional<ResultMeaningValidator> meaningValidator
    ) {}

    public ValidationChainBuilder(
            ConnectionPoolManager poolManager,
            LlmClient llmClient,
            SchemaProvider schemaProvider,
            AppConfig.QueryConfig queryConfig) {
        this.poolManager = poolManager;
        this.llmClient = llmClient;
        this.schemaProvider = schemaProvider;
        this.queryConfig = queryConfig;
    }

    public ValidationChain build() {
        var rules = new ArrayList<SqlValidationRule>();
        rules.add(new SecurityValidator());
        rules.add(new SqlAstValidator());

        Optional<ParseOnlyValidator> parseOnly = poolManager != null
            ? Optional.of(new ParseOnlyValidator(poolManager))
            : Optional.empty();

        Optional<ResultMeaningValidator> meaning = queryConfig.features().resultMeaningValidation()
            ? Optional.of(new ResultMeaningValidator())
            : Optional.empty();

        return new ValidationChain(rules, parseOnly, meaning);
    }
}
