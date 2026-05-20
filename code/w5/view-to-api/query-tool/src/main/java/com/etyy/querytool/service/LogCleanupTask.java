package com.etyy.querytool.service;

import com.etyy.querytool.config.AppConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LogCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(LogCleanupTask.class);

    private final JdbcTemplate jdbcTemplate;
    private final AppConfig config;

    public LogCleanupTask(JdbcTemplate jdbcTemplate, AppConfig config) {
        this.jdbcTemplate = jdbcTemplate;
        this.config = config;
    }

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void cleanOldLogs() {
        try {
            int threshold = config.getCleanupThreshold();
            int target = config.getCleanupTarget();
            int batchSize = config.getCleanupBatchSize();

            Integer currentCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM query_log", Integer.class);

            if (currentCount == null || currentCount <= threshold) {
                return;
            }

            int totalDeleted = 0;
            while (currentCount > target) {
                int deleted = jdbcTemplate.update(
                        "DELETE FROM query_log WHERE id IN (" +
                                "  SELECT id FROM query_log ORDER BY request_time ASC LIMIT ?" +
                                ")",
                        Math.min(batchSize, currentCount - target));

                if (deleted <= 0) break;

                totalDeleted += deleted;
                currentCount -= deleted;

                // Pause between batches
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            if (totalDeleted > 0) {
                log.info("日志自动清理：删除 {} 条旧记录，当前剩余 {} 条",
                        totalDeleted, currentCount);
            }
        } catch (Exception e) {
            log.error("日志自动清理失败", e);
        }
    }
}
