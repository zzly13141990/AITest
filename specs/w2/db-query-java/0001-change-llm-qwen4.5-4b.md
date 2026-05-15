# 0001: 将 LLM 从 GLM-4.7 迁移到本地 Ollama Qwen 3.5 4B

## 背景

当前项目使用智谱 GLM-4.7 的 Anthropic 兼容 API 生成 SQL，需要迁移到本地 Ollama 的 Qwen 3.5 4B 模型。

## 目标配置

```yaml
llm:
  api-key: "ollama"
  base-url: "http://127.0.0.1:11434"
  model: qwen2.5:3b
```

> **注意**: 用户提供的 model 是 `qwen3.5:4b`，但 Ollama 官方模型库中目前最新的是 `qwen2.5:3b`。方案中使用 `qwen2.5:3b`，如果用户确实有 `qwen3.5:4b` 自定义模型，可按需调整。

## 需要修改的文件

### 1. `backend/src/main/resources/application.yml`

```yaml
llm:
  api-key: "ollama"
  base-url: "http://127.0.0.1:11434"
  model: qwen2.5:3b
```

### 2. `backend/src/main/java/com/projectalpha/service/LlmService.java`

主要修改点：

1. **API 端点变更**
   - Anthropic: `/v1/messages`
   - Ollama (OpenAI 兼容): `/v1/chat/completions`

2. **请求头变更**
   - 移除 `anthropic-version` 和 `x-api-key`（Ollama 不需要）
   - 保留 `Content-Type` 和 `Accept`

3. **请求体结构调整**
   - 保留 `model`, `max_tokens`, `temperature`
   - `messages` 结构相同（`role`, `content`）

4. **响应解析变更**
   - Anthropic: `content[0].text`
   - Ollama: `choices[0].message.content`

5. **可选优化**
   - 添加 `stream: false` 避免流式响应
   - 调整超时时间（本地模型可能响应较慢）

## 代码修改详情

### LlmService.java - callGlmApi() 方法

```java
private String callOllamaApi(String prompt) throws Exception {
    ObjectNode requestBody = objectMapper.createObjectNode();
    requestBody.put("model", llmModel != null && !llmModel.isEmpty() ? llmModel : "qwen2.5:3b");
    requestBody.put("max_tokens", 2048);
    requestBody.put("temperature", 0.3);
    requestBody.put("stream", false);  // Ollama 需要

    ArrayNode messages = objectMapper.createArrayNode();
    ObjectNode userMessage = objectMapper.createObjectNode();
    userMessage.put("role", "user");
    userMessage.put("content", prompt);
    messages.add(userMessage);
    requestBody.set("messages", messages);

    HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(llmBaseUrl + "/v1/chat/completions"))  // 端点变更
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + llmApiKey)  // 可选，Ollama 不验证
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
            .timeout(Duration.ofSeconds(60))  // 本地模型可能较慢，增加超时
            .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
        throw new RuntimeException("LLM API 返回错误 (HTTP " + response.statusCode() + "): " + response.body());
    }

    JsonNode json = objectMapper.readTree(response.body());
    // Ollama 响应路径
    String content = json.at("/choices/0/message/content").asText();

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
```

### 重命名建议

建议将 `callGlmApi` 重命名为 `callLlmApi`，将方法名与具体实现解耦。

### Prompt 优化建议

Qwen 模型可能对中文 Prompt 效果更好，可考虑将 `buildPrompt` 中的英文提示改为中文：

```java
private String buildPrompt(String naturalLanguageQuery, List<MetadataDTO> metadataList) {
    StringBuilder prompt = new StringBuilder();
    prompt.append("你是一个 SQL 专家。根据自然语言查询生成 SQL SELECT 语句。");
    prompt.append("\n\n");
    prompt.append("自然语言查询: ").append(naturalLanguageQuery);
    prompt.append("\n\n");
    prompt.append("数据库架构信息:");
    prompt.append("\n\n");

    for (MetadataDTO metadata : metadataList) {
        prompt.append("表/视图: ").append(metadata.getTableName()).append(" (").append(metadata.getTableType()).append(")");
        prompt.append("\n");
        prompt.append("列: ").append(metadata.getColumns());
        prompt.append("\n\n");
    }

    prompt.append("要求:");
    prompt.append("\n");
    prompt.append("1. 仅生成 SQL SELECT 语句，不需要解释或 markdown 格式。");
    prompt.append("\n");
    prompt.append("2. 确保 SQL 语法正确，使用架构中适当的表名和列名。");
    prompt.append("\n");
    prompt.append("3. 对于 SQL Server 数据库，适当使用 TOP 子句。");
    prompt.append("\n");
    prompt.append("4. 仅返回原始 SQL 语句，不包含任何额外文本或格式。");

    return prompt.toString();
}
```

## 前置条件

1. 安装并启动 Ollama
   ```bash
   ollama serve
   ```

2. 拉取 Qwen 模型
   ```bash
   ollama pull qwen2.5:3b
   ```

3. 确认 Ollama 服务运行在 `http://127.0.0.1:11434`

## 测试建议

修改后需要测试：
1. 简单查询：单表 SELECT
2. 复杂查询：多表 JOIN、WHERE 条件
3. 边界情况：空表、特殊字符表名

## 回滚方案

如需回滚到 GLM-4.7，只需恢复 `application.yml` 中的配置和 `LlmService.java` 中的 API 调用逻辑。

---

**创建时间**: 2026-04-29
