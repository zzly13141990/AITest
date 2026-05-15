package com.projectalpha.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.projectalpha.dto.MetadataDTO;
import com.projectalpha.repository.MetadataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for generating SQL using GLM LLM (Anthropic-compatible API)
 */
@Service
public class LlmService {
    private final MetadataRepository metadataRepository;

    @Value("${llm.api-key}")
    private String llmApiKey;

    @Value("${llm.base-url}")
    private String llmBaseUrl;

    @Value("${llm.model}")
    private String llmModel;

    private HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LlmService(MetadataRepository metadataRepository) {
        this.metadataRepository = metadataRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    protected HttpClient getHttpClient() {
        return httpClient;
    }

    protected void setHttpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public String generateSql(long connectionId, String naturalLanguageQuery) {
        if (llmApiKey == null || llmApiKey.isEmpty()) {
            throw new RuntimeException("LLM API Key未配置，请在application.yml中设置llm.api-key");
        }

        List<MetadataDTO> metadataList = metadataRepository.findByConnectionId(connectionId).stream()
                .map(metadata -> {
                    MetadataDTO dto = new MetadataDTO();
                    dto.setTableName(metadata.getTableName());
                    dto.setTableType(metadata.getTableType());
                    dto.setColumns(metadata.getColumns());
                    return dto;
                })
                .collect(Collectors.toList());

        String prompt = buildPrompt(naturalLanguageQuery, metadataList);

        try {
            return callGlmApi(prompt);
        } catch (Exception e) {
            throw new RuntimeException("生成SQL失败: " + e.getMessage(), e);
        }
    }

    private String callGlmApi(String prompt) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", llmModel != null && !llmModel.isEmpty() ? llmModel : "glm-4.7");
        requestBody.put("max_tokens", 2048);
        requestBody.put("temperature", 0.3);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode userMessage = objectMapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        requestBody.set("messages", messages);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(llmBaseUrl + "/v1/messages"))
                .header("Content-Type", "application/json")
                .header("x-api-key", llmApiKey)
                .header("anthropic-version", "2023-06-01")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("LLM API 返回错误 (HTTP " + response.statusCode() + "): " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        String content = json.at("/content/0/text").asText();

        if (content == null || content.isEmpty()) {
            throw new RuntimeException("LLM 返回内容为空");
        }

        // 清理 markdown 标记
        content = content.trim();
        if (content.startsWith("```sql")) {
            content = content.substring(6);
        } else if (content.startsWith("```")) {
            content = content.substring(3);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        return content.trim();
    }

    private String buildPrompt(String naturalLanguageQuery, List<MetadataDTO> metadataList) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a SQL expert. Generate a SQL SELECT statement based on the following natural language query.");
        prompt.append("\n\n");
        prompt.append("Natural Language Query: ").append(naturalLanguageQuery);
        prompt.append("\n\n");
        prompt.append("Database schema information:");
        prompt.append("\n\n");

        for (MetadataDTO metadata : metadataList) {
            prompt.append("Table/View: ").append(metadata.getTableName()).append(" (").append(metadata.getTableType()).append(")");
            prompt.append("\n");
            prompt.append("Columns: ").append(metadata.getColumns());
            prompt.append("\n\n");
        }

        prompt.append("Requirements:");
        prompt.append("\n");
        prompt.append("1. Generate only the SQL SELECT statement, no explanations or markdown formatting.");
        prompt.append("\n");
        prompt.append("2. Make sure the SQL is syntactically correct and uses appropriate table and column names from the schema.");
        prompt.append("\n");
        prompt.append("3. Use TOP clause for SQL Server databases when appropriate.");
        prompt.append("\n");
        prompt.append("4. Return only the raw SQL statement without any additional text or formatting.");

        return prompt.toString();
    }
}
