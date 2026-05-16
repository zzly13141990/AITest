package com.sqlserver.mcp.pipeline;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig.Features;
import com.sqlserver.mcp.execution.CollectResult;
import com.sqlserver.mcp.execution.QueryExecutor;
import com.sqlserver.mcp.execution.ResultFormatter;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.model.query.ExecutionResult;
import com.sqlserver.mcp.model.query.QueryRequest;
import com.sqlserver.mcp.model.query.QueryResponse;
import com.sqlserver.mcp.model.schema.DatabaseSchema;
import com.sqlserver.mcp.schema.SchemaContextBuilder;
import com.sqlserver.mcp.schema.SchemaProvider;
import com.sqlserver.mcp.validation.ParseOnlyValidator;
import com.sqlserver.mcp.validation.ResultMeaningValidator;
import com.sqlserver.mcp.validation.SqlValidationRule;
import com.sqlserver.mcp.validation.ValidationResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryPipelineServiceTest {

    @Mock private SchemaProvider schemaProvider;
    @Mock private SchemaContextBuilder contextBuilder;
    @Mock private LlmClient llmClient;
    @Mock private SqlValidationRule validationRule;
    @Mock private ParseOnlyValidator parseOnlyValidator;
    @Mock private ResultMeaningValidator meaningValidator;
    @Mock private QueryExecutor queryExecutor;
    @Mock private ResultFormatter textFormatter;
    @Mock private ResultFormatter jsonFormatter;

    private final QueryConfig queryConfig = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(true));
    private final LlmConfig llmConfig = new LlmConfig(
        "https://api.test.com", "test-model", "key", 0.1, 2000,
        Duration.ofSeconds(30), 3,
        List.of(Duration.ofSeconds(1))
    );

    private QueryPipelineService createService(Optional<ParseOnlyValidator> l3, Optional<ResultMeaningValidator> l4) {
        return new QueryPipelineService(
            schemaProvider, contextBuilder, llmClient,
            List.of(validationRule), l3, l4,
            queryExecutor, textFormatter, jsonFormatter,
            queryConfig, llmConfig
        );
    }

    @Test
    void sqlOnlyMode_shouldReturnSqlOnly() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), Instant.now());
        when(schemaProvider.getSchema("testdb")).thenReturn(schema);
        when(contextBuilder.buildContext(any(), anyString(), anyInt())).thenReturn("schema context");
        when(llmClient.generateSql(anyString(), anyString())).thenReturn("SELECT * FROM users");
        when(validationRule.check(anyString(), any())).thenReturn(Optional.empty());

        var service = createService(Optional.empty(), Optional.empty());
        var request = new QueryRequest("show users", "testdb", QueryRequest.Mode.sql_only, null, null, null);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.SqlOnly.class, response);
        assertEquals("SELECT * FROM users", ((QueryResponse.SqlOnly) response).sql());
    }

    @Test
    void executeMode_shouldReturnSuccess() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), Instant.now());
        var data = new CollectResult(List.of("c"), List.of(List.of(1)), 1, false, 10);
        var execResult = new ExecutionResult(data, 1, "SELECT * FROM users");

        when(schemaProvider.getSchema("testdb")).thenReturn(schema);
        when(contextBuilder.buildContext(any(), anyString(), anyInt())).thenReturn("schema");
        when(llmClient.generateSql(anyString(), anyString())).thenReturn("SELECT * FROM users");
        when(validationRule.check(anyString(), any())).thenReturn(Optional.empty());
        when(parseOnlyValidator.check(anyString(), any())).thenReturn(Optional.empty());
        when(queryExecutor.execute(anyString(), anyString(), anyInt(), anyInt())).thenReturn(execResult);
        when(textFormatter.format(any())).thenReturn("| c |\n| --- |\n| 1 |");

        var service = createService(Optional.of(parseOnlyValidator), Optional.empty());
        var request = new QueryRequest("show users", "testdb", QueryRequest.Mode.execute, null, null, QueryRequest.OutputFormat.text);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.Success.class, response);
        var success = (QueryResponse.Success) response;
        assertNotNull(success.text());
        assertEquals("testdb", success.meta().database());
        assertEquals("SELECT * FROM users", success.meta().sql());
        assertEquals(1, success.meta().totalRows());
    }

    @Test
    void validationFailure_shouldReturnError() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), Instant.now());
        when(schemaProvider.getSchema("testdb")).thenReturn(schema);
        when(contextBuilder.buildContext(any(), anyString(), anyInt())).thenReturn("schema");
        when(llmClient.generateSql(anyString(), anyString())).thenReturn("SELECT * FROM users");
        when(validationRule.check(anyString(), any()))
            .thenReturn(Optional.of(ValidationResult.reject(
                "READ_ONLY_VIOLATION", "not allowed", "use SELECT", Map.of()
            )));

        var service = createService(Optional.empty(), Optional.empty());
        var request = new QueryRequest("drop users", "testdb", QueryRequest.Mode.execute, null, null, null);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.Error.class, response);
        assertEquals("INVALID_INPUT", ((QueryResponse.Error) response).errorCode());
    }

    @Test
    void parseOnlyValidationFailure_shouldReturnSyntaxError() {
        var schema = new DatabaseSchema("testdb", Map.of(), Map.of(), List.of(), Instant.now());
        when(schemaProvider.getSchema("testdb")).thenReturn(schema);
        when(contextBuilder.buildContext(any(), anyString(), anyInt())).thenReturn("schema");
        when(llmClient.generateSql(anyString(), anyString())).thenReturn("SELECT invalid sql");
        when(validationRule.check(anyString(), any())).thenReturn(Optional.empty());
        when(parseOnlyValidator.check(anyString(), any()))
            .thenReturn(Optional.of(ValidationResult.reject(
                "SYNTAX_ERROR", "bad syntax", "check syntax", Map.of()
            )));

        var service = createService(Optional.of(parseOnlyValidator), Optional.empty());
        var request = new QueryRequest("test", "testdb", QueryRequest.Mode.execute, null, null, null);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.Error.class, response);
    }

    @Test
    void exceptionInPipeline_shouldReturnError() {
        when(schemaProvider.getSchema(anyString())).thenThrow(new RuntimeException("unexpected"));

        var service = createService(Optional.empty(), Optional.empty());
        var request = new QueryRequest("test", "testdb", QueryRequest.Mode.sql_only, null, null, null);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.Error.class, response);
    }

    @Test
    void emptyDatabase_shouldUseDefault() {
        when(schemaProvider.getSchema("default")).thenReturn(
            new DatabaseSchema("default", Map.of(), Map.of(), List.of(), Instant.now()));
        when(contextBuilder.buildContext(any(), anyString(), anyInt())).thenReturn("ctx");
        when(llmClient.generateSql(anyString(), anyString())).thenReturn("SELECT 1");
        when(validationRule.check(anyString(), any())).thenReturn(Optional.empty());

        var service = createService(Optional.empty(), Optional.empty());
        var request = new QueryRequest("test", null, QueryRequest.Mode.sql_only, null, null, null);
        var response = service.execute(request);

        assertInstanceOf(QueryResponse.SqlOnly.class, response);
        verify(schemaProvider).getSchema("default");
    }
}
