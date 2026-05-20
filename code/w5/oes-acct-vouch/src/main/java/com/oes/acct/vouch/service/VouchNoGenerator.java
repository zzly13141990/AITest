package com.oes.acct.vouch.service;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.exception.OptimisticLockException;
import com.oes.acct.vouch.repository.VouchNoSeqRepository;
import com.oes.acct.vouch.repository.VouchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class VouchNoGenerator {

    private static final Logger log = LoggerFactory.getLogger(VouchNoGenerator.class);

    private final StringRedisTemplate redisTemplate;
    private final VouchRepository vouchRepository;
    private final VouchNoSeqRepository vouchNoSeqRepository;

    @Value("${oes.acct.vouch.vouch-no.redis-lock-ttl:10000}")
    private long redisLockTtl;

    @Value("${oes.acct.vouch.vouch-no.redis-lock-wait:5000}")
    private long redisLockWait;

    @Value("${oes.acct.vouch.vouch-no.redis-lock-retry-delay:100}")
    private long redisLockRetryDelay;

    @Value("${oes.acct.vouch.vouch-no.redis-lock-max-retries:5}")
    private int redisLockMaxRetries;

    @Value("${oes.acct.vouch.vouch-no.optimistic-lock-max-retries:3}")
    private int optimisticLockMaxRetries;

    @Value("${oes.acct.vouch.vouch-no.optimistic-lock-initial-delay-ms:100}")
    private long optimisticLockInitialDelayMs;

    @Value("${oes.acct.vouch.vouch-no.optimistic-lock-backoff-multiplier:2.0}")
    private double optimisticLockBackoffMultiplier;

    public VouchNoGenerator(StringRedisTemplate redisTemplate, VouchRepository vouchRepository,
                            VouchNoSeqRepository vouchNoSeqRepository) {
        this.redisTemplate = redisTemplate;
        this.vouchRepository = vouchRepository;
        this.vouchNoSeqRepository = vouchNoSeqRepository;
    }

    /**
     * Primary strategy: Redis distributed lock.
     * Lock is held until caller releases it after INSERT completes.
     */
    public int nextVouchNoWithLock(String compCode, String copyCode, String acctYear, String acctMonth) {
        String lockKey = buildLockKey(compCode, copyCode, acctYear, acctMonth);

        for (int i = 0; i < redisLockMaxRetries; i++) {
            Boolean acquired = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "locked", redisLockTtl, TimeUnit.MILLISECONDS);

            if (Boolean.TRUE.equals(acquired)) {
                try {
                    Integer maxNo = vouchRepository.findMaxVouchNo(compCode, copyCode, acctYear, acctMonth)
                            .orElse(0);
                    int newNo = maxNo + 1;
                    log.debug("Generated vouch_no={} for {}/{}/{}/{}", newNo, compCode, copyCode, acctYear, acctMonth);
                    return newNo;
                } catch (Exception e) {
                    redisTemplate.delete(lockKey);
                    throw e;
                }
                // Note: Lock is NOT released here. Caller releases after INSERT completes.
            }

            log.debug("Redis lock contention, retry {}/{} for key: {}", i + 1, redisLockMaxRetries, lockKey);
            try {
                Thread.sleep(redisLockRetryDelay);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BusinessException(ErrorCode.VOUCH_NO_CONFLICT, "凭证号生成被中断");
            }
        }

        throw new BusinessException(ErrorCode.VOUCH_NO_CONFLICT, "凭证号生成繁忙，请稍后重试");
    }

    /**
     * Release the Redis lock after INSERT completes.
     */
    public void releaseLock(String compCode, String copyCode, String acctYear, String acctMonth) {
        String lockKey = buildLockKey(compCode, copyCode, acctYear, acctMonth);
        redisTemplate.delete(lockKey);
        log.debug("Redis lock released: {}", lockKey);
    }

    /**
     * Fallback strategy: Optimistic locking via database version column.
     */
    public int nextVouchNoWithOptimisticLock(String compCode, String copyCode, String acctYear, String acctMonth) {
        vouchNoSeqRepository.initIfAbsent(compCode, copyCode, acctYear, acctMonth);

        long delayMs = optimisticLockInitialDelayMs;
        for (int i = 0; i < optimisticLockMaxRetries; i++) {
            Integer version = vouchNoSeqRepository.getVersion(compCode, copyCode, acctYear, acctMonth);
            if (version == null) {
                throw new BusinessException(ErrorCode.VOUCH_NO_CONFLICT, "凭证号序列初始化失败");
            }

            int rowsAffected = vouchNoSeqRepository.incrementAndGet(compCode, copyCode, acctYear, acctMonth, version);
            if (rowsAffected > 0) {
                Integer nextNo = vouchNoSeqRepository.getCurrentNo(compCode, copyCode, acctYear, acctMonth);
                log.debug("Optimistic lock generated vouch_no={} for {}/{}/{}/{}", nextNo, compCode, copyCode, acctYear, acctMonth);
                return nextNo != null ? nextNo : 1;
            }

            log.debug("Optimistic lock contention, retry {}/{}", i + 1, optimisticLockMaxRetries);
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new OptimisticLockException("凭证号乐观锁重试被中断");
            }
            delayMs = (long) (delayMs * optimisticLockBackoffMultiplier);
        }

        throw new OptimisticLockException("凭证号乐观锁重试耗尽，请稍后重试");
    }

    private String buildLockKey(String compCode, String copyCode, String acctYear, String acctMonth) {
        return String.format("oes:vouch:no:%s:%s:%s:%s", compCode, copyCode, acctYear, acctMonth);
    }
}
