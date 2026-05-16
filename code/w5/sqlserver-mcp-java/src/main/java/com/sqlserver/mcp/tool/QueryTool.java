package com.sqlserver.mcp.tool;

import com.sqlserver.mcp.model.error.McpException;
import com.sqlserver.mcp.model.query.QueryRequest;
import com.sqlserver.mcp.model.query.QueryResponse;
import com.sqlserver.mcp.pipeline.QueryPipelineService;
import com.sqlserver.mcp.util.JsonUtils;
import io.modelcontextprotocol.spec.McpSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

public class QueryTool {
    private static final Logger log = LoggerFactory.getLogger(QueryTool.class);

    private final QueryPipelineService pipeline;

    public QueryTool(QueryPipelineService pipeline) {
        this.pipeline = pipeline;
    }

    public McpSchema.Tool getToolDefinition() {
        return McpSchema.Tool.builder()
            .name("query")
            .description("根据自然语言查询 SQL Server 数据库，返回 SQL 或查询结果")
            .inputSchema(new McpSchema.JsonSchema(
                "object",
                Map.of(
                    "query", Map.of(
                        "type", "string",
                        "description", "自然语言查询描述，例如：'查询所有用户的邮箱和注册时间'"
                    ),
                    "database", Map.of(
                        "type", "string",
                        "description", "数据库名称，不指定则使用默认数据库"
                    ),
                    "mode", Map.of(
                        "type", "string",
                        "description", "执行模式：sql_only 仅生成 SQL，execute 执行查询",
                        "enum", List.of("sql_only", "execute")
                    ),
                    "page", Map.of(
                        "type", "integer",
                        "description", "页码，从 1 开始"
                    ),
                    "pageSize", Map.of(
                        "type", "integer",
                        "description", "每页行数"
                    ),
                    "outputFormat", Map.of(
                        "type", "string",
                        "description", "输出格式：text 或 json",
                        "enum", List.of("text", "json")
                    )
                ),
                List.of("query"),
                null, null, null
            ))
            .build();
    }

    public McpSchema.CallToolResult handleCall(McpSchema.CallToolRequest request) {
        try {
            var arguments = request.arguments();
            if (arguments == null || arguments.isEmpty()) {
                return McpSchema.CallToolResult.builder()
                    .addTextContent("缺少必要参数: query")
                    .isError(true)
                    .build();
            }

            var queryRequest = JsonUtils.mapper().convertValue(arguments, QueryRequest.class);
            log.info("Tool called: query='{}', database={}, mode={}",
                queryRequest.query(), queryRequest.database(), queryRequest.mode());

            var response = pipeline.execute(queryRequest);
            return response.toCallToolResult();
        } catch (McpException e) {
            log.warn("Tool call failed with McpException: {} ({})", e.errorCode(), e.getMessage());
            return QueryResponse.error(e).toCallToolResult();
        } catch (Exception e) {
            log.error("Tool call failed with unexpected error", e);
            return McpSchema.CallToolResult.builder()
                .addTextContent("工具调用失败: " + e.getMessage())
                .isError(true)
                .build();
        }
    }
}
