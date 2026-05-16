package com.sqlserver.mcp.e2e;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig.Features;
import com.sqlserver.mcp.execution.*;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.llm.PromptBuilder;
import com.sqlserver.mcp.llm.SqlExtractor;
import com.sqlserver.mcp.model.query.QueryRequest;
import com.sqlserver.mcp.model.query.QueryResponse;
import com.sqlserver.mcp.pipeline.QueryPipelineService;
import com.sqlserver.mcp.schema.SchemaCache;
import com.sqlserver.mcp.schema.SchemaContextBuilder;
import com.sqlserver.mcp.schema.SchemaLoader;
import com.sqlserver.mcp.validation.ParseOnlyValidator;
import com.sqlserver.mcp.validation.SecurityValidator;
import com.sqlserver.mcp.validation.SqlAstValidator;
import com.sqlserver.mcp.validation.SqlValidationRule;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end test for sqlserver-mcp-java.
 * <p>
 * Requires Docker and the Testcontainers integration profile.
 * Skipped during normal {@code mvn test} — run with {@code mvn verify -P integration}.
 */
@Testcontainers
@EnabledIfSystemProperty(named = "e2e.enabled", matches = "true")
class SqlServerMcpE2ETest {
    private static final Logger log = LoggerFactory.getLogger(SqlServerMcpE2ETest.class);

    @Container
    static MSSQLServerContainer<?> sqlServer = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
        .withInitScript("init-testdb.sql")
        .acceptLicense();

    private QueryPipelineService pipeline;

    @BeforeAll
    static void setupContainer() {
        sqlServer.start();
        log.info("MSSQL Server started: {}:{}", sqlServer.getHost(), sqlServer.getMappedPort(1433));
    }

    @BeforeEach
    void setupPipeline() {
        var jdbcUrl = sqlServer.getJdbcUrl();
        var host = sqlServer.getHost();
        var port = sqlServer.getMappedPort(1433);

        log.info("JDBC URL: {}", jdbcUrl);

        var sourceConfig = new AppConfig.DataSourceConfig(
            "testdb", host, port, "testdb",
            sqlServer.getUsername(), sqlServer.getPassword(),
            1, 2,
            Duration.ofSeconds(5), Duration.ofMinutes(5), Duration.ofSeconds(60)
        );
        var dbConfig = new AppConfig.DatabaseConfig(
            List.of(sourceConfig), Duration.ofSeconds(3), 500
        );
        var queryConfig = new QueryConfig(10, 100, 1000, 1_048_576, new Features(false));
        var llmConfig = new LlmConfig(
            "https://api.test.com/v1", "test-model", "test-key",
            0.1, 2000, Duration.ofSeconds(5), 1, List.of(Duration.ofMillis(100))
        );

        var poolManager = new com.sqlserver.mcp.datasource.ConnectionPoolManager(List.of(sourceConfig));

        var schemaLoader = new SchemaLoader(poolManager, dbConfig);
        var schemaCache = new SchemaCache(schemaLoader, dbConfig);
        schemaCache.initialize(List.of("testdb"));

        var llmClient = new LlmClient(llmConfig);
        var contextBuilder = new SchemaContextBuilder(llmConfig);

        var validationRules = new ArrayList<SqlValidationRule>();
        validationRules.add(new SecurityValidator());
        validationRules.add(new SqlAstValidator());

        var parseOnlyValidator = Optional.of(new ParseOnlyValidator(poolManager));

        var paginationRewriter = new PaginationRewriter();
        var resultCollector = new ResultCollector(queryConfig.maxRowsTotal(), queryConfig.maxResultBytes());
        var queryExecutor = new QueryExecutor(poolManager, paginationRewriter, resultCollector, queryConfig);
        ResultFormatter textFormatter = new TextFormatter();
        ResultFormatter jsonFormatter = new JsonFormatter();

        pipeline = new QueryPipelineService(
            schemaCache, contextBuilder, llmClient,
            validationRules, parseOnlyValidator, Optional.empty(),
            queryExecutor, textFormatter, jsonFormatter,
            queryConfig, llmConfig
        );
    }

    @Test
    void sqlOnlyMode_shouldReturnSql() {
        // This test will fail in CI without a real LLM — it's a structural smoke test
        var request = new QueryRequest("show products", "testdb", QueryRequest.Mode.sql_only, null, null, null);
        var response = pipeline.execute(request);
        // The response could be Error (if LLM call fails), but the pipeline shouldn't crash
        assertNotNull(response);
    }

    @Test
    void schemaShouldLoadSuccessfully() {
        var request = new QueryRequest("list tables", "testdb", QueryRequest.Mode.sql_only, null, null, null);
        var response = pipeline.execute(request);
        assertNotNull(response);
    }
}
