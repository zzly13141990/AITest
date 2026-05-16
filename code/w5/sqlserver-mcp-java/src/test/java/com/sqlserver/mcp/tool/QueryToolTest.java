package com.sqlserver.mcp.tool;

import com.sqlserver.mcp.model.query.QueryResponse;
import com.sqlserver.mcp.pipeline.QueryPipelineService;
import io.modelcontextprotocol.spec.McpSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryToolTest {

    @Mock
    private QueryPipelineService pipeline;

    @Test
    void getToolDefinition_shouldReturnTool() {
        var tool = new QueryTool(pipeline);
        var definition = tool.getToolDefinition();
        assertEquals("query", definition.name());
        assertNotNull(definition.description());
        assertNotNull(definition.inputSchema());
    }

    @Test
    void handleCall_shouldReturnResult() {
        when(pipeline.execute(any()))
            .thenReturn(new QueryResponse.SqlOnly("SELECT * FROM users"));

        var tool = new QueryTool(pipeline);
        var request = McpSchema.CallToolRequest.builder()
            .name("query")
            .arguments(Map.of("query", "show users"))
            .build();
        var result = tool.handleCall(request);

        assertFalse(result.isError());
        assertNotNull(result.content());
    }

    @Test
    void handleCall_withMissingArguments_shouldReturnError() {
        var tool = new QueryTool(pipeline);
        var request = McpSchema.CallToolRequest.builder()
            .name("query")
            .arguments(Map.of())
            .build();
        var result = tool.handleCall(request);

        assertTrue(result.isError());
    }

    @Test
    void handleCall_withNullArguments_shouldReturnError() {
        var tool = new QueryTool(pipeline);
        var request = McpSchema.CallToolRequest.builder()
            .name("query")
            .build();
        var result = tool.handleCall(request);

        assertTrue(result.isError());
    }
}
