package com.sqlserver.mcp.datasource;

import com.sqlserver.mcp.config.AppConfig.DataSourceConfig;
import org.junit.jupiter.api.Test;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class DataSourceFactoryTest {

    @Test
    void createDataSource_shouldBuildHikariConfig() {
        var config = new DataSourceConfig(
            "testdb", "myserver", 1433, "testdb", "SA", "pass",
            2, 5,
            Duration.ofSeconds(5), Duration.ofMinutes(30), Duration.ofSeconds(60)
        );
        var ds = DataSourceFactory.createDataSource(config);
        assertNotNull(ds);
        assertEquals("testdb", ds.getPoolName());
        assertTrue(ds.getJdbcUrl().contains("myserver:1433"));
        assertTrue(ds.getJdbcUrl().contains("database=testdb"));
        assertFalse(ds.isClosed());
        ds.close();
    }

    @Test
    void createDataSource_shouldHandleDifferentPort() {
        var config = new DataSourceConfig(
            "testdb", "server2", 14330, "testdb", "SA", "pass",
            1, 2,
            Duration.ofSeconds(5), Duration.ofMinutes(30), Duration.ofSeconds(60)
        );
        var ds = DataSourceFactory.createDataSource(config);
        assertTrue(ds.getJdbcUrl().contains("server2:14330"));
        ds.close();
    }
}
