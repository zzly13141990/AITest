package com.etyy.querytool.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Value("${connection-pool.max-pool-size:20}")
    private int maxPoolSize;

    @Value("${connection-pool.max-pool-count:10}")
    private int maxPoolCount;

    @Value("${connection-pool.max-total-connections:200}")
    private int maxTotalConnections;

    @Value("${connection-pool.idle-timeout-minutes:10}")
    private int idleTimeoutMinutes;

    @Value("${connection-pool.connection-timeout-ms:10000}")
    private int connectionTimeoutMs;

    @Value("${log.cleanup.threshold:400000}")
    private int cleanupThreshold;

    @Value("${log.cleanup.target:300000}")
    private int cleanupTarget;

    @Value("${log.cleanup.batch-size:5000}")
    private int cleanupBatchSize;

    public int getMaxPoolSize() { return maxPoolSize; }
    public int getMaxPoolCount() { return maxPoolCount; }
    public int getMaxTotalConnections() { return maxTotalConnections; }
    public int getIdleTimeoutMinutes() { return idleTimeoutMinutes; }
    public int getConnectionTimeoutMs() { return connectionTimeoutMs; }
    public int getCleanupThreshold() { return cleanupThreshold; }
    public int getCleanupTarget() { return cleanupTarget; }
    public int getCleanupBatchSize() { return cleanupBatchSize; }
}
