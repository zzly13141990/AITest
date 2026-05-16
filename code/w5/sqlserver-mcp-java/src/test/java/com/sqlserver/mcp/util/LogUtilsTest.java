package com.sqlserver.mcp.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class LogUtilsTest {

    @Test
    void generateRequestId_shouldReturnNonEmptyString() {
        var id = LogUtils.generateRequestId();
        assertNotNull(id);
        assertFalse(id.isBlank());
    }

    @Test
    void generateRequestId_shouldReturnUniqueIds() {
        var id1 = LogUtils.generateRequestId();
        var id2 = LogUtils.generateRequestId();
        assertNotEquals(id1, id2);
    }

    @Test
    void clear_shouldNotThrow() {
        LogUtils.putRequestId("test-id");
        LogUtils.putDatabase("test-db");
        LogUtils.putStage("test-stage");
        assertDoesNotThrow(LogUtils::clear);
    }

    @Test
    void putAndClear_shouldNotThrow_whenCalledRepeatedly() {
        assertDoesNotThrow(() -> {
            LogUtils.putRequestId("id1");
            LogUtils.putDatabase("db1");
            LogUtils.putStage("stage1");
            LogUtils.clear();
            LogUtils.putRequestId("id2");
            LogUtils.putDatabase("db2");
            LogUtils.clear();
        });
    }
}
