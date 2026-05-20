package com.oes.acct.vouch.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SnowflakeIdGenerator {

    private static final Logger log = LoggerFactory.getLogger(SnowflakeIdGenerator.class);

    private static final String REDIS_KEY_VOUCH = "oes:acct:id:vouch";
    private static final String REDIS_KEY_DETAIL = "oes:acct:id:detail";

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    public SnowflakeIdGenerator(JdbcTemplate jdbcTemplate, StringRedisTemplate redisTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
    }

    public long nextVouchId() {
        return nextId(REDIS_KEY_VOUCH, "acct_vouch", "vouch_id");
    }

    public long nextDetailId() {
        return nextId(REDIS_KEY_DETAIL, "acct_vouch_detail", "vouch_detail_id");
    }

    private long nextId(String redisKey, String table, String column) {
        Long id = redisIncr(redisKey);
        if (id != null) {
            return id;
        }
        log.info("Redis 缓存未命中 {}, 从数据库初始化", redisKey);
        long max = fetchMax(table, column);
        long nextVal = max + 1;
        redisTemplate.opsForValue().set(redisKey, String.valueOf(nextVal));
        redisIncr(redisKey);
        return nextVal;
    }

    private Long redisIncr(String key) {
        try {
            Long val = redisTemplate.opsForValue().increment(key);
            return val != null && val > 1 ? val - 1 : null;
        } catch (DataAccessException e) {
            log.warn("Redis INCR 失败, key={}", key);
            return null;
        }
    }

    private long fetchMax(String table, String column) {
        Long max = jdbcTemplate.queryForObject(
                "SELECT ISNULL(MAX(" + column + "), 0) FROM " + table, Long.class);
        return max != null ? max : 0;
    }
}