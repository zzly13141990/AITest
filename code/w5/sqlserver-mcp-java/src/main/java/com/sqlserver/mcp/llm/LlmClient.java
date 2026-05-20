package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.model.error.LlmApiException;
import tools.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

public class LlmClient {
    private static final Logger log = LoggerFactory.getLogger(LlmClient.class);

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final LlmConfig config;
    private final OkHttpClient httpClient;
    private final CircuitBreaker circuitBreaker;
    private final LlmRetryHandler retryHandler;

    public LlmClient(LlmConfig config) {
        this.config = config;
        this.httpClient = createHttpClient(config);
        this.circuitBreaker = new CircuitBreaker();
        this.retryHandler = new LlmRetryHandler(config);
    }

    public String generateSql(String systemPrompt, String userPrompt) {
        var requestBody = buildRequestBody(systemPrompt, userPrompt);
        return circuitBreaker.executeSupplier(() ->
            retryHandler.executeWithRetry(() -> callApi(requestBody))
        );
    }

    public double validateMeaning(String userQuery, String sql, String sampleResult) {
        var validationPrompt = PromptBuilder.buildValidationPrompt(userQuery, sql, sampleResult);
        var requestBody = buildSimpleRequestBody(validationPrompt);
        var response = circuitBreaker.executeSupplier(() ->
            retryHandler.executeWithRetry(() -> callApi(requestBody))
        );
        return parseValidationScore(response);
    }

    private String callApi(String requestBodyJson) throws IOException {
        var url = config.apiBaseUrl() + "/chat/completions";
        var request = new Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer " + config.apiKey())
            .post(RequestBody.create(requestBodyJson, JSON))
            .build();

        log.debug("Calling LLM API: POST {}", url);
        try (var response = httpClient.newCall(request).execute()) {
            var body = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                var statusCode = response.code();
                var errorMsg = "LLM API returned HTTP " + statusCode + ": " + truncate(body, 200);

                if (statusCode == 429) {
                    throw new LlmApiException(errorMsg + " (rate limited, retryable)");
                }
                if (statusCode >= 500) {
                    throw new LlmApiException(errorMsg + " (5xx, retryable)");
                }
                if (statusCode >= 400) {
                    throw new LlmApiException(errorMsg + " (4xx, non-retryable)");
                }
                throw new LlmApiException(errorMsg);
            }

            return parseResponseBody(body);
        }
    }

    private String parseResponseBody(String body) {
        try {
            var json = MAPPER.readTree(body);
            var choices = json.get("choices");
            if (choices == null || !choices.isArray() || choices.isEmpty()) {
                throw new LlmApiException("LLM response missing choices array: " + truncate(body, 200));
            }
            var message = choices.get(0).get("message");
            if (message == null) {
                throw new LlmApiException("LLM response missing message in choice: " + truncate(body, 200));
            }
            var content = message.get("content");
            if (content == null || content.isNull()) {
                return "";
            }
            return content.asText();
        } catch (LlmApiException e) {
            throw e;
        } catch (Exception e) {
            throw new LlmApiException("Failed to parse LLM response: " + e.getMessage(), e);
        }
    }

    private String buildRequestBody(String systemPrompt, String userPrompt) {
        try {
            var root = MAPPER.createObjectNode();
            root.put("model", config.model());
            root.put("temperature", config.temperature());
            root.put("max_tokens", config.maxTokens());

            var messages = MAPPER.createArrayNode();

            var systemMsg = MAPPER.createObjectNode();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            var userMsg = MAPPER.createObjectNode();
            userMsg.put("role", "user");
            userMsg.put("content", userPrompt);
            messages.add(userMsg);

            root.set("messages", messages);
            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build request body", e);
        }
    }

    private String buildSimpleRequestBody(String prompt) {
        try {
            var root = MAPPER.createObjectNode();
            root.put("model", config.model());
            root.put("temperature", 0.0);
            root.put("max_tokens", 50);

            var messages = MAPPER.createArrayNode();
            var userMsg = MAPPER.createObjectNode();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);
            messages.add(userMsg);

            root.set("messages", messages);
            return MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build request body", e);
        }
    }

    private double parseValidationScore(String response) {
        if (response == null || response.isBlank()) return 0.5;
        try {
            var trimmed = response.trim();
            return Double.parseDouble(trimmed);
        } catch (NumberFormatException e) {
            var matcher = java.util.regex.Pattern.compile("(0?\\.\\d+|1\\.0|0|1)").matcher(response);
            if (matcher.find()) {
                try {
                    return Double.parseDouble(matcher.group(1));
                } catch (NumberFormatException ex) {
                    // fall through
                }
            }
        }
        log.warn("Could not parse validation score from: {}", truncate(response, 100));
        return 0.5;
    }

    private static OkHttpClient createHttpClient(LlmConfig config) {
        var timeout = config.timeout() != null ? config.timeout() : Duration.ofSeconds(30);
        return new OkHttpClient.Builder()
            .connectTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
            .readTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
            .writeTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
            .build();
    }

    private static String truncate(String text, int maxLen) {
        return text != null && text.length() > maxLen
            ? text.substring(0, maxLen) + "..."
            : text;
    }
}
