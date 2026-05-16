package com.sqlserver.mcp.datasource;

import com.sqlserver.mcp.config.AppConfig.DataSourceConfig;
import com.sqlserver.mcp.model.error.DbConnectionException;
import com.sqlserver.mcp.model.error.SchemaNotFoundException;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;

public class ConnectionPoolManager implements AutoCloseable {
    private static final Logger log = LoggerFactory.getLogger(ConnectionPoolManager.class);
    private static final Duration DEFAULT_QUERY_TIMEOUT = Duration.ofSeconds(30);

    private final ConcurrentHashMap<String, HikariDataSource> pools = new ConcurrentHashMap<>();
    private final ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();
    private final Duration queryTimeout;

    public ConnectionPoolManager(List<DataSourceConfig> configs) {
        this(configs, DEFAULT_QUERY_TIMEOUT);
    }

    public ConnectionPoolManager(List<DataSourceConfig> configs, Duration queryTimeout) {
        this.queryTimeout = queryTimeout != null ? queryTimeout : DEFAULT_QUERY_TIMEOUT;
        for (var config : configs) {
            try {
                var ds = DataSourceFactory.createDataSource(config);
                pools.put(config.name(), ds);
                log.info("Connection pool created for database '{}': host={}, poolSize={}-{}",
                    config.name(), config.host(), config.minPoolSize(), config.maxPoolSize());
            } catch (Exception e) {
                log.warn("Failed to create connection pool for database '{}': {}", config.name(), e.getMessage());
            }
        }
    }

    public <T> T withConnection(String database, SqlFunction<Connection, T> action) throws DbConnectionException {
        var future = virtualExecutor.submit(() -> {
            var ds = pools.get(database);
            if (ds == null) throw new SchemaNotFoundException(database);
            try (var conn = ds.getConnection()) {
                return action.apply(conn);
            }
        });
        try {
            return future.get(queryTimeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw new DbConnectionException(database, "query timed out after " + queryTimeout);
        } catch (ExecutionException e) {
            var cause = e.getCause();
            if (cause instanceof DbConnectionException dbEx) throw dbEx;
            if (cause instanceof SchemaNotFoundException schemaEx) throw schemaEx;
            if (cause instanceof SQLException sqlEx) {
                throw new DbConnectionException(database, sqlEx);
            }
            throw new DbConnectionException(database, cause != null ? cause.getMessage() : "unknown error");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new DbConnectionException(database, "interrupted");
        }
    }

    public <T> T withConnection(String database, String sql, SqlFunction<java.sql.ResultSet, T> mapper)
        throws DbConnectionException {
        return withConnection(database, conn -> {
            try (var stmt = conn.createStatement()) {
                stmt.setQueryTimeout((int) queryTimeout.toMillis() / 1000);
                try (var rs = stmt.executeQuery(sql)) {
                    return mapper.apply(rs);
                }
            }
        });
    }

    public boolean isAvailable(String database) {
        var ds = pools.get(database);
        return ds != null && !ds.isClosed();
    }

    @Override
    public void close() {
        log.info("Closing all connection pools...");
        pools.forEach((name, ds) -> {
            if (!ds.isClosed()) {
                ds.close();
                log.debug("Connection pool '{}' closed", name);
            }
        });
        virtualExecutor.shutdown();
        try {
            if (!virtualExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                log.warn("Virtual executor did not terminate gracefully, forcing shutdown");
                virtualExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            virtualExecutor.shutdownNow();
        }
        log.info("All connection pools closed");
    }
}
