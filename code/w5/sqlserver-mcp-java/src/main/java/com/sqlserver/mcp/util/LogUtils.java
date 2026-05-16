package com.sqlserver.mcp.util;

import org.slf4j.MDC;

import java.util.UUID;

public final class LogUtils {
    public static final String REQUEST_ID = "requestId";
    public static final String DATABASE = "database";
    public static final String STAGE = "stage";

    private LogUtils() {}

    public static String generateRequestId() {
        return UUID.randomUUID().toString();
    }

    public static void putRequestId(String requestId) {
        MDC.put(REQUEST_ID, requestId);
    }

    public static void putDatabase(String database) {
        MDC.put(DATABASE, database);
    }

    public static void putStage(String stage) {
        MDC.put(STAGE, stage);
    }

    public static void clear() {
        MDC.clear();
    }
}
