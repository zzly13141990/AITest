package com.etyy.querytool.service;

import com.etyy.querytool.config.AppConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("LogCleanupTask Unit Tests")
class LogCleanupTaskTest {

    private AppConfig appConfig;

    @BeforeEach
    void setUp() {
        appConfig = new AppConfig();
    }

    @Test
    @DisplayName("Cleanup threshold should be configurable")
    void testCleanupThreshold() {
        assertEquals(400000, appConfig.getCleanupThreshold());
    }

    @Test
    @DisplayName("Cleanup target should be less than threshold")
    void testCleanupTarget() {
        assertTrue(appConfig.getCleanupTarget() < appConfig.getCleanupThreshold(),
                "Target should be less than threshold");
    }

    @Test
    @DisplayName("Cleanup batch size should be positive")
    void testCleanupBatchSize() {
        assertTrue(appConfig.getCleanupBatchSize() > 0);
    }
}
