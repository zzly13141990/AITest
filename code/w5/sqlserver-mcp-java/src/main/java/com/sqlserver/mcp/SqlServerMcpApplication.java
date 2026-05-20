package com.sqlserver.mcp;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.config.ConfigLoader;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.execution.JsonFormatter;
import com.sqlserver.mcp.execution.PaginationRewriter;
import com.sqlserver.mcp.execution.QueryExecutor;
import com.sqlserver.mcp.execution.ResultCollector;
import com.sqlserver.mcp.execution.ResultFormatter;
import com.sqlserver.mcp.execution.TextFormatter;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.observability.MetricsRegistry;
import com.sqlserver.mcp.observability.OpenTelemetryConfig;
import com.sqlserver.mcp.pipeline.QueryPipelineService;
import com.sqlserver.mcp.schema.SchemaCache;
import com.sqlserver.mcp.schema.SchemaContextBuilder;
import com.sqlserver.mcp.schema.SchemaLoader;
import com.sqlserver.mcp.tool.QueryTool;
import com.sqlserver.mcp.validation.ParseOnlyValidator;
import com.sqlserver.mcp.validation.ResultMeaningValidator;
import com.sqlserver.mcp.validation.SecurityValidator;
import com.sqlserver.mcp.validation.SqlAstValidator;
import com.sqlserver.mcp.validation.SqlValidationRule;
import io.modelcontextprotocol.json.McpJsonDefaults;
import io.modelcontextprotocol.server.McpServer;
import io.modelcontextprotocol.server.transport.HttpServletSseServerTransportProvider;
import io.modelcontextprotocol.server.transport.HttpServletStreamableServerTransportProvider;
import io.modelcontextprotocol.server.transport.StdioServerTransportProvider;
import io.modelcontextprotocol.spec.McpSchema;
import org.eclipse.jetty.ee10.servlet.ServletContextHandler;
import org.eclipse.jetty.ee10.servlet.ServletHolder;
import org.eclipse.jetty.server.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;

public class SqlServerMcpApplication {
    private static final Logger log = LoggerFactory.getLogger(SqlServerMcpApplication.class);

    public static void main(String[] args) {
        var startTime = System.currentTimeMillis();
        log.info("Starting sqlserver-mcp-java...");

        // === Configuration ===
        var appConfig = ConfigLoader.load(args);
        var databaseConfig = appConfig.database();
        var queryConfig = appConfig.query();
        var llmConfig = appConfig.llm();
        var mcpConfig = appConfig.mcp();
        log.info("AppConfig: server={}, databases={}, llm={}, features={}, transport={}",
            mcpConfig.serverName(), databaseConfig.sources().size(),
            llmConfig.model(), queryConfig.features(), mcpConfig.transport());

        // === Observability ===
        var openTelemetry = OpenTelemetryConfig.create(appConfig.observability());
        var metricsRegistry = new MetricsRegistry(appConfig.observability());

        // === Connection Pools ===
        var poolManager = new ConnectionPoolManager(databaseConfig.sources());

        // === Schema ===
        var schemaLoader = new SchemaLoader(poolManager, databaseConfig);
        var schemaCache = new SchemaCache(schemaLoader, databaseConfig);

        var databaseNames = databaseConfig.sources().stream()
            .map(AppConfig.DataSourceConfig::name)
            .toList();
        if (!databaseNames.isEmpty()) {
            log.info("Pre-loading schemas for databases: {}", databaseNames);
            schemaCache.initialize(databaseNames);
        }

        // === LLM Module ===
        var llmClient = new LlmClient(llmConfig);
        var schemaContextBuilder = new SchemaContextBuilder(llmConfig);

        // === Validation Rules (L1 + L2) ===
        var validationRules = new ArrayList<SqlValidationRule>();
        validationRules.add(new SecurityValidator());
        validationRules.add(new SqlAstValidator());

        // === L3: ParseOnlyValidator ===
        Optional<ParseOnlyValidator> parseOnlyValidator = databaseConfig.sources().isEmpty()
            ? Optional.empty()
            : Optional.of(new ParseOnlyValidator(poolManager));

        // === L4: ResultMeaningValidator ===
        Optional<ResultMeaningValidator> meaningValidator = queryConfig.features().resultMeaningValidation()
            ? Optional.of(new ResultMeaningValidator())
            : Optional.empty();

        // === Execution ===
        var paginationRewriter = new PaginationRewriter();
        var resultCollector = new ResultCollector(queryConfig.maxRowsTotal(), queryConfig.maxResultBytes());
        var queryExecutor = new QueryExecutor(poolManager, paginationRewriter, resultCollector, queryConfig);
        ResultFormatter textFormatter = new TextFormatter();
        ResultFormatter jsonFormatter = new JsonFormatter();

        // === Pipeline ===
        var pipeline = new QueryPipelineService(
            schemaCache,
            schemaContextBuilder,
            llmClient,
            validationRules,
            parseOnlyValidator,
            meaningValidator,
            queryExecutor,
            textFormatter,
            jsonFormatter,
            queryConfig,
            llmConfig
        );

        // === Tool ===
        var queryTool = new QueryTool(pipeline);

        // === MCP Server (by transport) ===
        try {
            var mapper = McpJsonDefaults.getMapper();
            var transport = mcpConfig.transport();

            switch (transport) {
                case "stdio" -> startStdio(mcpConfig, queryTool, mapper, poolManager, startTime);
                case "streamable-http" -> startStreamableHttp(mcpConfig, queryTool, mapper, poolManager, startTime);
                default -> startSse(mcpConfig, queryTool, mapper, poolManager, startTime);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.info("Server interrupted, shutting down");
        } catch (Exception e) {
            log.error("Failed to start MCP server", e);
            System.exit(1);
        }
    }

    private static void startStdio(
        AppConfig.McpConfig mcpConfig,
        QueryTool queryTool,
        io.modelcontextprotocol.json.McpJsonMapper mapper,
        ConnectionPoolManager poolManager,
        long startTime
    ) throws Exception {
        var stdioTransport = new StdioServerTransportProvider(mapper);
        var mcpServer = McpServer.sync(stdioTransport)
            .serverInfo(mcpConfig.serverName(), mcpConfig.serverVersion())
            .capabilities(McpSchema.ServerCapabilities.builder()
                .tools(true)
                .build())
            .toolCall(queryTool.getToolDefinition(),
                (exchange, request) -> queryTool.handleCall(request))
            .build();

        var elapsed = System.currentTimeMillis() - startTime;
        log.info("SqlServerMcpApplication started in {}ms: transport=stdio, tools=1", elapsed);

        var latch = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            shutdownMcpServer(mcpServer, poolManager);
            latch.countDown();
        }));
        latch.await();
    }

    private static void startSse(
        AppConfig.McpConfig mcpConfig,
        QueryTool queryTool,
        io.modelcontextprotocol.json.McpJsonMapper mapper,
        ConnectionPoolManager poolManager,
        long startTime
    ) throws Exception {
        var port = mcpConfig.port();
        var sseTransport = HttpServletSseServerTransportProvider.builder()
            .jsonMapper(mapper)
            .baseUrl("http://localhost:" + port)
            .messageEndpoint("/mcp")
            .sseEndpoint("/mcp")
            .build();

        var jettyServer = new Server(port);
        var servletContext = new ServletContextHandler(ServletContextHandler.SESSIONS);
        servletContext.setContextPath("/");
        jettyServer.setHandler(servletContext);
        servletContext.addServlet(new ServletHolder(sseTransport), "/*");

        jettyServer.start();
        log.info("Jetty server started on port {}", port);

        var mcpServer = McpServer.sync(sseTransport)
            .serverInfo(mcpConfig.serverName(), mcpConfig.serverVersion())
            .capabilities(McpSchema.ServerCapabilities.builder()
                .tools(true)
                .build())
            .toolCall(queryTool.getToolDefinition(),
                (exchange, request) -> queryTool.handleCall(request))
            .build();

        var elapsed = System.currentTimeMillis() - startTime;
        log.info("SqlServerMcpApplication started in {}ms: transport=sse, port={}, tools=1",
            elapsed, port);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                jettyServer.stop();
            } catch (Exception e) {
                log.warn("Error stopping Jetty: {}", e.getMessage());
            }
            shutdownMcpServer(mcpServer, poolManager);
        }));

        jettyServer.join();
    }

    private static void startStreamableHttp(
        AppConfig.McpConfig mcpConfig,
        QueryTool queryTool,
        io.modelcontextprotocol.json.McpJsonMapper mapper,
        ConnectionPoolManager poolManager,
        long startTime
    ) throws Exception {
        var port = mcpConfig.port();
        var streamTransport = HttpServletStreamableServerTransportProvider.builder()
            .jsonMapper(mapper)
            .mcpEndpoint("/mcp")
            .build();

        var jettyServer = new Server(port);
        var servletContext = new ServletContextHandler(ServletContextHandler.SESSIONS);
        servletContext.setContextPath("/");
        jettyServer.setHandler(servletContext);
        servletContext.addServlet(new ServletHolder(streamTransport), "/*");

        jettyServer.start();
        log.info("Jetty server started on port {}", port);

        var mcpServer = McpServer.sync(streamTransport)
            .serverInfo(mcpConfig.serverName(), mcpConfig.serverVersion())
            .capabilities(McpSchema.ServerCapabilities.builder()
                .tools(true)
                .build())
            .toolCall(queryTool.getToolDefinition(),
                (exchange, request) -> queryTool.handleCall(request))
            .build();

        var elapsed = System.currentTimeMillis() - startTime;
        log.info("SqlServerMcpApplication started in {}ms: transport=streamable-http, port={}, tools=1",
            elapsed, port);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                jettyServer.stop();
            } catch (Exception e) {
                log.warn("Error stopping Jetty: {}", e.getMessage());
            }
            shutdownMcpServer(mcpServer, poolManager);
        }));

        jettyServer.join();
    }

    private static void shutdownMcpServer(
        io.modelcontextprotocol.server.McpSyncServer mcpServer,
        ConnectionPoolManager poolManager
    ) {
        log.info("Shutting down sqlserver-mcp-java...");
        try {
            mcpServer.closeGracefully();
        } catch (Exception e) {
            log.warn("Error closing MCP server: {}", e.getMessage());
        }
        poolManager.close();
        log.info("Shutdown complete");
    }
}
