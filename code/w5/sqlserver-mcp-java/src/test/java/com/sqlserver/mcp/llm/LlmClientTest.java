package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

class LlmClientTest {

    private HttpServer server;
    private LlmClient client;
    private int port;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.setExecutor(Executors.newSingleThreadExecutor());
        server.start();
        port = server.getAddress().getPort();

        var config = new LlmConfig(
            "http://localhost:" + port,
            "test-model", "test-key",
            0.1, 2000,
            Duration.ofSeconds(10), 0,
            List.of()
        );
        client = new LlmClient(config);
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void generateSql_shouldReturnContent() {
        registerHandler("/chat/completions", exchange -> {
            readRequestBody(exchange);
            respond(exchange, 200, "{\"choices\":[{\"message\":{\"content\":\"SELECT * FROM users\"}}]}");
        });

        var result = client.generateSql("system prompt", "find users");
        assertEquals("SELECT * FROM users", result);
    }

    @Test
    void generateSql_shouldHandleEmptyContent() {
        registerHandler("/chat/completions", exchange -> {
            readRequestBody(exchange);
            respond(exchange, 200, "{\"choices\":[{\"message\":{\"content\":null}}]}");
        });

        var result = client.generateSql("system", "query");
        assertEquals("", result);
    }

    @Test
    void generateSql_shouldHandleMissingChoices() {
        registerHandler("/chat/completions", exchange -> {
            readRequestBody(exchange);
            respond(exchange, 200, "{}");
        });

        assertThrows(Exception.class, () -> client.generateSql("system", "query"));
    }

    @Test
    void generateSql_shouldHandleServerError() {
        registerHandler("/chat/completions", exchange -> {
            readRequestBody(exchange);
            respond(exchange, 500, "Internal Server Error");
        });

        assertThrows(Exception.class, () -> client.generateSql("system", "query"));
    }

    @Test
    void validateMeaning_shouldParseScore() {
        registerHandler("/chat/completions", exchange -> {
            readRequestBody(exchange);
            respond(exchange, 200, "{\"choices\":[{\"message\":{\"content\":\"0.85\"}}]}");
        });

        var score = client.validateMeaning("find users", "SELECT * FROM users", "sample");
        assertEquals(0.85, score, 0.001);
    }

    private void registerHandler(String path, Handler handler) {
        server.createContext(path, exchange -> {
            try {
                handler.handle(exchange);
            } finally {
                exchange.close();
            }
        });
    }

    private void readRequestBody(HttpExchange exchange) throws IOException {
        try (var is = exchange.getRequestBody()) {
            is.readAllBytes();
        }
    }

    private void respond(HttpExchange exchange, int code, String body) throws IOException {
        var bytes = body.getBytes();
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    @FunctionalInterface
    interface Handler {
        void handle(HttpExchange exchange) throws IOException;
    }
}
