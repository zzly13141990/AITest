package com.sqlserver.mcp.datasource;

import com.sqlserver.mcp.config.AppConfig.DataSourceConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public final class DataSourceFactory {

    private DataSourceFactory() {}

    public static HikariDataSource createDataSource(DataSourceConfig config) {
        var hikariConfig = new HikariConfig();

        var jdbcUrl = String.format(
            "jdbc:sqlserver://%s:%d;database=%s;encrypt=true;trustServerCertificate=true;loginTimeout=%d",
            config.host(),
            config.port(),
            config.database(),
            config.connectionTimeout().toSeconds()
        );

        hikariConfig.setJdbcUrl(jdbcUrl);
        hikariConfig.setUsername(config.username());
        hikariConfig.setPassword(config.password());
        hikariConfig.setMinimumIdle(config.minPoolSize());
        hikariConfig.setMaximumPoolSize(config.maxPoolSize());
        hikariConfig.setConnectionTimeout(config.connectionTimeout().toMillis());
        hikariConfig.setMaxLifetime(config.maxLifetime().toMillis());
        hikariConfig.setLeakDetectionThreshold(config.leakDetectionThreshold().toMillis());
        hikariConfig.setConnectionTestQuery("SELECT 1");
        hikariConfig.setPoolName(config.name());
        hikariConfig.setAutoCommit(true);
        // Don't fail on pool startup if DB is unreachable — retry at query time
        hikariConfig.setInitializationFailTimeout(-1);

        // Virtual thread compatibility: no ThreadLocal usage
        hikariConfig.setThreadFactory(Thread.ofVirtual().factory());

        return new HikariDataSource(hikariConfig);
    }
}
