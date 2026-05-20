package com.etyy.querytool.service;

import com.etyy.querytool.config.AppConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class ConnectionManager {

    private static final Logger log = LoggerFactory.getLogger(ConnectionManager.class);

    private final ConcurrentHashMap<String, HikariDataSource> connectionPools = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastUsedTime = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
    private final AppConfig config;

    public ConnectionManager(AppConfig config) {
        this.config = config;
    }

    @PostConstruct
    public void startCleanupTask() {
        cleanupScheduler.scheduleAtFixedRate(this::cleanupIdlePools, 5, 5, TimeUnit.MINUTES);
    }

    @PreDestroy
    public void shutdown() {
        cleanupScheduler.shutdown();
        for (HikariDataSource ds : connectionPools.values()) {
            ds.close();
        }
    }

    /**
     * Get a connection for the given database key. Creates a pool if not exists.
     */
    public Connection getConnection(String dbKey, String dbType, String host, int port,
                                    String dbName, String username, String password) throws SQLException {
        HikariDataSource ds = connectionPools.get(dbKey);
        if (ds == null) {
            synchronized (this) {
                ds = connectionPools.get(dbKey);
                if (ds == null) {
                    // Check pool count limit
                    if (connectionPools.size() >= config.getMaxPoolCount()) {
                        throw new SQLException("目标数据库连接池已满（上限" + config.getMaxPoolCount() + "个池）");
                    }

                    // Check total connections limit
                    int totalActive = getTotalActiveConnections();
                    if (totalActive >= config.getMaxTotalConnections()) {
                        throw new SQLException("全局连接数已达上限（" + config.getMaxTotalConnections() + "）");
                    }

                    ds = createDataSource(dbType, host, port, dbName, username, password);
                    connectionPools.put(dbKey, ds);
                    log.info("Created connection pool for {}", dbKey);
                }
            }
        }

        lastUsedTime.put(dbKey, System.currentTimeMillis());
        return ds.getConnection();
    }

    private HikariDataSource createDataSource(String dbType, String host, int port,
                                               String dbName, String username, String password) {
        HikariConfig hikariConfig = new HikariConfig();
        String jdbcUrl = buildJdbcUrl(dbType, host, port, dbName);

        hikariConfig.setJdbcUrl(jdbcUrl);
        hikariConfig.setUsername(username);
        hikariConfig.setPassword(password);
        hikariConfig.setMaximumPoolSize(config.getMaxPoolSize());
        hikariConfig.setConnectionTimeout(config.getConnectionTimeoutMs());
        hikariConfig.setIdleTimeout(TimeUnit.MINUTES.toMillis(config.getIdleTimeoutMinutes()));
        hikariConfig.setConnectionTestQuery("SELECT 1");
        hikariConfig.setPoolName("pool-" + host + "-" + port);

        return new HikariDataSource(hikariConfig);
    }

    private String buildJdbcUrl(String dbType, String host, int port, String dbName) {
        switch (dbType.toLowerCase()) {
            case "mysql":
                return "jdbc:mysql://" + host + ":" + port + "/" + dbName
                        + "?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8";
            case "sqlserver":
                return "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + dbName;
            case "oracle":
                return "jdbc:oracle:thin:@" + host + ":" + port + ":" + dbName;
            default:
                throw new IllegalArgumentException("Unsupported database type: " + dbType);
        }
    }

    private int getTotalActiveConnections() {
        AtomicInteger total = new AtomicInteger();
        connectionPools.forEach((key, ds) -> {
            total.addAndGet(ds.getHikariPoolMXBean().getActiveConnections());
        });
        return total.get();
    }

    /**
     * Clean up idle pools that have been unused for more than idleTimeoutMinutes.
     */
    private void cleanupIdlePools() {
        long now = System.currentTimeMillis();
        long idleThreshold = TimeUnit.MINUTES.toMillis(config.getIdleTimeoutMinutes());

        Iterator<Map.Entry<String, HikariDataSource>> it = connectionPools.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, HikariDataSource> entry = it.next();
            String key = entry.getKey();
            HikariDataSource ds = entry.getValue();
            long lastUsed = lastUsedTime.getOrDefault(key, 0L);
            int activeConnections = ds.getHikariPoolMXBean().getActiveConnections();

            if ((now - lastUsed) > idleThreshold && activeConnections == 0) {
                ds.close();
                it.remove();
                lastUsedTime.remove(key);
                log.info("Closed idle connection pool for {}", key);
            }
        }
    }
}
