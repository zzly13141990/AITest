package com.sqlserver.mcp.validation;

import com.sqlserver.mcp.config.AppConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig;
import com.sqlserver.mcp.config.AppConfig.QueryConfig.Features;
import com.sqlserver.mcp.datasource.ConnectionPoolManager;
import com.sqlserver.mcp.llm.LlmClient;
import com.sqlserver.mcp.schema.SchemaProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ValidationChainBuilderTest {

    @Mock private ConnectionPoolManager poolManager;
    @Mock private LlmClient llmClient;
    @Mock private SchemaProvider schemaProvider;

    @Test
    void build_shouldIncludeL1AndL2() {
        var config = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(false));
        var builder = new ValidationChainBuilder(poolManager, llmClient, schemaProvider, config);
        var chain = builder.build();

        assertEquals(2, chain.rules().size());
        assertInstanceOf(SecurityValidator.class, chain.rules().get(0));
        assertInstanceOf(SqlAstValidator.class, chain.rules().get(1));
    }

    @Test
    void build_shouldIncludeL3_whenPoolManagerPresent() {
        var config = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(false));
        var builder = new ValidationChainBuilder(poolManager, llmClient, schemaProvider, config);
        var chain = builder.build();

        assertTrue(chain.parseOnlyValidator().isPresent());
    }

    @Test
    void build_shouldExcludeL3_whenPoolManagerNull() {
        var config = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(false));
        var builder = new ValidationChainBuilder(null, llmClient, schemaProvider, config);
        var chain = builder.build();

        assertTrue(chain.parseOnlyValidator().isEmpty());
    }

    @Test
    void build_shouldIncludeL4_whenFeatureEnabled() {
        var config = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(true));
        var builder = new ValidationChainBuilder(poolManager, llmClient, schemaProvider, config);
        var chain = builder.build();

        assertTrue(chain.meaningValidator().isPresent());
    }

    @Test
    void build_shouldExcludeL4_whenFeatureDisabled() {
        var config = new QueryConfig(100, 10000, 100000, 52_428_800, new Features(false));
        var builder = new ValidationChainBuilder(poolManager, llmClient, schemaProvider, config);
        var chain = builder.build();

        assertTrue(chain.meaningValidator().isEmpty());
    }
}
