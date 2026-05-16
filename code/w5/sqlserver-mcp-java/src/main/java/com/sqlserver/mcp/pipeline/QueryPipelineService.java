package com.sqlserver.mcp.pipeline;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.execution.QueryExecutor;
import com.sqlserver.mcp.execution.ResultFormatter;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.llm.PromptBuilder;
import com.sqlserver.mcp.llm.SqlExtractor;
import com.sqlserver.mcp.model.error.InternalException;
import com.sqlserver.mcp.model.error.InvalidInputException;
import com.sqlserver.mcp.model.error.McpException;
import com.sqlserver.mcp.model.error.SqlSyntaxException;
import com.sqlserver.mcp.model.query.QueryRequest;
import com.sqlserver.mcp.model.query.QueryResponse;
import com.sqlserver.mcp.schema.SchemaContextBuilder;
import com.sqlserver.mcp.schema.SchemaProvider;
import com.sqlserver.mcp.util.LogUtils;
import com.sqlserver.mcp.validation.ParseOnlyValidator;
import com.sqlserver.mcp.validation.ResultMeaningValidator;
import com.sqlserver.mcp.validation.SqlValidationRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

public class QueryPipelineService {
    private static final Logger log = LoggerFactory.getLogger(QueryPipelineService.class);

    private final SchemaProvider schemaProvider;
    private final SchemaContextBuilder contextBuilder;
    private final LlmClient llmClient;
    private final List<SqlValidationRule> validationRules;
    private final Optional<ParseOnlyValidator> parseOnlyValidator;
    private final Optional<ResultMeaningValidator> meaningValidator;
    private final QueryExecutor queryExecutor;
    private final ResultFormatter textFormatter;
    private final ResultFormatter jsonFormatter;
    private final QueryConfig config;
    private final AppConfig.LlmConfig llmConfig;

    public QueryPipelineService(
        SchemaProvider schemaProvider,
        SchemaContextBuilder contextBuilder,
        LlmClient llmClient,
        List<SqlValidationRule> validationRules,
        Optional<ParseOnlyValidator> parseOnlyValidator,
        Optional<ResultMeaningValidator> meaningValidator,
        QueryExecutor queryExecutor,
        ResultFormatter textFormatter,
        ResultFormatter jsonFormatter,
        QueryConfig config,
        AppConfig.LlmConfig llmConfig
    ) {
        this.schemaProvider = schemaProvider;
        this.contextBuilder = contextBuilder;
        this.llmClient = llmClient;
        this.validationRules = validationRules;
        this.parseOnlyValidator = parseOnlyValidator;
        this.meaningValidator = meaningValidator;
        this.queryExecutor = queryExecutor;
        this.textFormatter = textFormatter;
        this.jsonFormatter = jsonFormatter;
        this.config = config;
        this.llmConfig = llmConfig;
    }

    public QueryResponse execute(QueryRequest request) {
        var startTime = System.currentTimeMillis();
        var requestId = LogUtils.generateRequestId();

        try {
            LogUtils.putRequestId(requestId);
            var database = request.database() != null ? request.database() : "default";
            LogUtils.putDatabase(database);

            // --- Stage 1: Schema ---
            LogUtils.putStage("schema");
            log.info("Pipeline [{}] starting for database '{}': query='{}'", requestId, database, request.query());
            var schema = schemaProvider.getSchema(database);

            // --- Stage 2: Context ---
            LogUtils.putStage("context");
            var tokenBudget = llmConfig.maxTokens() * 50 / 100;
            var schemaContext = contextBuilder.buildContext(schema, request.query(), tokenBudget);
            log.debug("Schema context built: {} chars", schemaContext.length());

            // --- Stage 3: Build prompt + call LLM ---
            LogUtils.putStage("llm");
            var systemPrompt = PromptBuilder.SYSTEM_PROMPT_TEMPLATE
                    .replace("{schema_context}", schemaContext);
            var llmOutput = llmClient.generateSql(systemPrompt, request.query());
            log.debug("LLM response received: {} chars", llmOutput.length());

            // --- Stage 4: Extract SQL ---
            LogUtils.putStage("extract");
            var sql = SqlExtractor.extract(llmOutput);
            log.debug("SQL extracted: {} chars", sql.length());

            // --- Stage 6: L1 + L2 Validation ---
            LogUtils.putStage("validation");
            for (var rule : validationRules) {
                var result = rule.check(sql, schema);
                if (result.isPresent() && !result.get().passed()) {
                    var vr = result.get();
                    log.warn("Validation rejected by {}: {} (errorCode={})",
                        rule.getClass().getSimpleName(), vr.message(), vr.errorCode());
                    return QueryResponse.error(new InvalidInputException(vr.message(), vr.details()));
                }
            }

            // --- Stage 7: Execute or SQL-only ---
            if (request.isExecuteMode()) {
                // L3: Parse-only validation
                if (parseOnlyValidator.isPresent()) {
                    LogUtils.putStage("validation-l3");
                    var l3Result = parseOnlyValidator.get().check(sql, schema);
                    if (l3Result.isPresent() && !l3Result.get().passed()) {
                        var vr = l3Result.get();
                        log.warn("L3 validation rejected: {}", vr.message());
                        return QueryResponse.error(new SqlSyntaxException(sql, vr.message()));
                    }
                }

                // Execute
                LogUtils.putStage("execute");
                var page = request.effectivePage();
                var pageSize = request.effectivePageSize(config.defaultPageSize(), config.maxPageSize());
                var executionResult = queryExecutor.execute(sql, database, page, pageSize);
                log.debug("Query executed: {} rows collected of {} total",
                    executionResult.data().rows().size(), executionResult.totalRows());

                // Format
                LogUtils.putStage("format");
                var formattedText = switch (request.effectiveOutputFormat()) {
                    case json -> jsonFormatter.format(executionResult.data());
                    case text -> textFormatter.format(executionResult.data());
                };

                // L4: Result meaning validation
                var verificationScore = 1.0;
                var verificationPassed = true;
                if (meaningValidator.isPresent()) {
                    LogUtils.putStage("validation-l4");
                    var l4Result = meaningValidator.get().check(sql, schema);
                    if (l4Result.isPresent()) {
                        verificationScore = l4Result.get().passed() ? 1.0 : 0.5;
                        verificationPassed = l4Result.get().passed();
                        log.debug("L4 validation: score={}, passed={}", verificationScore, verificationPassed);
                    }
                }

                var elapsed = System.currentTimeMillis() - startTime;
                var meta = new QueryResponse.Meta(
                    database,
                    request.mode() != null ? request.mode().name() : "execute",
                    sql,
                    executionResult.data().rows().size(),
                    executionResult.totalRows(),
                    page,
                    pageSize,
                    verificationScore,
                    verificationPassed,
                    elapsed
                );

                log.info("Pipeline [{}] completed in {}ms: database={}, rows={}, mode=execute",
                    requestId, elapsed, database, executionResult.totalRows());
                return new QueryResponse.Success(formattedText, meta);
            } else {
                var elapsed = System.currentTimeMillis() - startTime;
                log.info("Pipeline [{}] completed in {}ms: database={}, mode=sql_only", requestId, elapsed, database);
                return new QueryResponse.SqlOnly(sql);
            }
        } catch (McpException e) {
            log.warn("Pipeline [{}] failed with McpException: {} ({})", requestId, e.errorCode(), e.getMessage());
            return QueryResponse.error(e);
        } catch (Exception e) {
            log.error("Pipeline [{}] failed with unexpected error", requestId, e);
            return QueryResponse.error(new InternalException("查询处理失败: " + e.getMessage()));
        } finally {
            LogUtils.clear();
        }
    }
}
