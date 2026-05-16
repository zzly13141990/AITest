package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.config.AppConfig.LlmConfig;
import com.sqlserver.mcp.model.error.LlmApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;

public class LlmRetryHandler {
    private static final Logger log = LoggerFactory.getLogger(LlmRetryHandler.class);

    private final int maxRetries;
    private final List<Duration> retryDelays;

    public LlmRetryHandler(LlmConfig config) {
        this.maxRetries = config.maxRetries();
        this.retryDelays = config.retryDelays();
    }

    public LlmRetryHandler(int maxRetries, List<Duration> retryDelays) {
        this.maxRetries = maxRetries;
        this.retryDelays = retryDelays;
    }

    public <T> T executeWithRetry(Callable<T> supplier) throws LlmApiException {
        var lastException = new LlmApiException("All retries exhausted");

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    var delay = getDelay(attempt - 1);
                    log.info("Retry attempt {}/{} after {}ms", attempt, maxRetries, delay.toMillis());
                    Thread.sleep(delay);
                }
                return supplier.call();
            } catch (LlmApiException e) {
                // LlmApiException is already our wrapper - check if retryable
                if (e.isRetryable()) {
                    lastException = e;
                    log.warn("Retryable LLM API error on attempt {}/{}: {}", attempt + 1, maxRetries, e.getMessage());
                } else {
                    throw e;
                }
            } catch (IOException e) {
                lastException = new LlmApiException("IO error on attempt " + (attempt + 1) + ": " + e.getMessage(), e);
                log.warn("IO error on attempt {}/{}: {}", attempt + 1, maxRetries, e.getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new LlmApiException("Retry interrupted", e);
            } catch (Exception e) {
                // Non-retryable: JSON parse errors, HTTP 4xx (except 429), etc.
                throw new LlmApiException("Non-retryable error: " + e.getMessage(), e);
            }
        }

        throw lastException;
    }

    private Duration getDelay(int attemptIndex) {
        if (attemptIndex < retryDelays.size()) {
            return retryDelays.get(attemptIndex);
        }
        // Fall back to last delay if we have more retries than configured delays
        return retryDelays.isEmpty() ? Duration.ofSeconds(1) : retryDelays.getLast();
    }
}
