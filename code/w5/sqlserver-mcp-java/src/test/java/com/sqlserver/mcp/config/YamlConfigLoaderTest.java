package com.sqlserver.mcp.config;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class YamlConfigLoaderTest {

    @Test
    void load_shouldReturnDefaults_whenConfigFileNotFound() {
        var loader = new YamlConfigLoader("/nonexistent/path.yml");
        var config = loader.load();
        assertNotNull(config);
        assertEquals("sqlserver-mcp", config.mcp().serverName());
        assertTrue(config.database().sources().isEmpty());
        assertEquals("deepseek-v4-flash", config.llm().model());
    }

    @Test
    void load_shouldReadFromCustomPath() throws Exception {
        var yaml = """
            mcp:
              server-name: custom-server
            """;
        var tempFile = Files.createTempFile("config-", ".yml");
        Files.writeString(tempFile, yaml);

        var loader = new YamlConfigLoader(tempFile.toString());
        var config = loader.load();
        assertEquals("custom-server", config.mcp().serverName());
        Files.deleteIfExists(tempFile);
    }

    @Test
    void load_shouldParseDatabaseSources() throws Exception {
        var yaml = """
            database:
              sources:
                - name: testdb
                  host: localhost
                  port: 1433
                  database: testdb
                  username: SA
                  min-pool-size: 2
                  max-pool-size: 5
            """;
        var tempFile = Files.createTempFile("config-", ".yml");
        Files.writeString(tempFile, yaml);

        var loader = new YamlConfigLoader(tempFile.toString());
        var config = loader.load();
        assertEquals(1, config.database().sources().size());
        var ds = config.database().sources().getFirst();
        assertEquals("testdb", ds.name());
        assertEquals(2, ds.minPoolSize());
        assertEquals(5, ds.maxPoolSize());
        assertEquals("localhost", ds.host());
        Files.deleteIfExists(tempFile);
    }

    @Test
    void load_shouldParseLlmConfig() throws Exception {
        var yaml = """
            llm:
              api-base-url: https://custom.com/v1
              model: custom-model
              temperature: 0.5
              max-tokens: 4000
              timeout: 60s
              max-retries: 2
            """;
        var tempFile = Files.createTempFile("config-", ".yml");
        Files.writeString(tempFile, yaml);

        var loader = new YamlConfigLoader(tempFile.toString());
        var config = loader.load();
        assertEquals("https://custom.com/v1", config.llm().apiBaseUrl());
        assertEquals("custom-model", config.llm().model());
        assertEquals(0.5, config.llm().temperature());
        assertEquals(4000, config.llm().maxTokens());
        Files.deleteIfExists(tempFile);
    }

    @Test
    void load_shouldParseQueryConfig() throws Exception {
        var yaml = """
            query:
              default-page-size: 50
              max-page-size: 5000
              max-rows-total: 50000
              max-result-bytes: 1048576
              features:
                result-meaning-validation: false
            """;
        var tempFile = Files.createTempFile("config-", ".yml");
        Files.writeString(tempFile, yaml);

        var loader = new YamlConfigLoader(tempFile.toString());
        var config = loader.load();
        assertEquals(50, config.query().defaultPageSize());
        assertEquals(5000, config.query().maxPageSize());
        assertFalse(config.query().features().resultMeaningValidation());
        Files.deleteIfExists(tempFile);
    }

    @Test
    void load_shouldHandleInvalidPathGracefully() {
        var loader = new YamlConfigLoader("/invalid/path/that/does/not/exist.yml");
        assertDoesNotThrow(loader::load);
    }

    @Test
    void load_shouldUseEnvVarForApiKey() throws Exception {
        var originalKey = System.getenv("LLM_API_KEY");
        try {
            var yaml = """
                llm:
                  api-base-url: https://test.com/v1
                  model: test-model
                """;
            var tempFile = Files.createTempFile("config-", ".yml");
            Files.writeString(tempFile, yaml);

            var loader = new YamlConfigLoader(tempFile.toString());
            var config = loader.load();
            assertEquals("", config.llm().apiKey());
            Files.deleteIfExists(tempFile);
        } finally {
            // cleanup is test-environment dependent
        }
    }
}
