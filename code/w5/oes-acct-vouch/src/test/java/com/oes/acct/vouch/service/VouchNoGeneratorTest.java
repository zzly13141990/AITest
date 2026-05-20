package com.oes.acct.vouch.service;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.OptimisticLockException;
import com.oes.acct.vouch.repository.VouchNoSeqRepository;
import com.oes.acct.vouch.repository.VouchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VouchNoGeneratorTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @Mock
    private VouchRepository vouchRepository;

    @Mock
    private VouchNoSeqRepository vouchNoSeqRepository;

    private VouchNoGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new VouchNoGenerator(redisTemplate, vouchRepository, vouchNoSeqRepository);
        ReflectionTestUtils.setField(generator, "redisLockTtl", 10000L);
        ReflectionTestUtils.setField(generator, "redisLockWait", 5000L);
        ReflectionTestUtils.setField(generator, "redisLockRetryDelay", 100L);
        ReflectionTestUtils.setField(generator, "redisLockMaxRetries", 5);
        ReflectionTestUtils.setField(generator, "optimisticLockMaxRetries", 3);
        ReflectionTestUtils.setField(generator, "optimisticLockInitialDelayMs", 100L);
        ReflectionTestUtils.setField(generator, "optimisticLockBackoffMultiplier", 2.0);

        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void nextVouchNoWithLock_whenRedisLockAcquired_shouldReturnNextNo() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(true);
        when(vouchRepository.findMaxVouchNo("01", "001", "2026", "05"))
                .thenReturn(Optional.of(5));

        int result = generator.nextVouchNoWithLock("01", "001", "2026", "05");

        assertEquals(6, result);
        verify(redisTemplate, never()).delete(lockKey);
    }

    @Test
    void nextVouchNoWithLock_whenFirstVouch_shouldReturnOne() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(true);
        when(vouchRepository.findMaxVouchNo("01", "001", "2026", "05"))
                .thenReturn(Optional.empty());

        int result = generator.nextVouchNoWithLock("01", "001", "2026", "05");

        assertEquals(1, result);
    }

    @Test
    void nextVouchNoWithLock_whenRedisLockContention_shouldRetryAndSucceed() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(false, false, true);
        when(vouchRepository.findMaxVouchNo("01", "001", "2026", "05"))
                .thenReturn(Optional.of(10));

        int result = generator.nextVouchNoWithLock("01", "001", "2026", "05");

        assertEquals(11, result);
        verify(valueOps, times(3))
                .setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS));
    }

    @Test
    void nextVouchNoWithLock_whenAllRetriesExhausted_shouldThrow() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(false);

        assertThrows(BusinessException.class,
                () -> generator.nextVouchNoWithLock("01", "001", "2026", "05"));
    }

    @Test
    void nextVouchNoWithLock_whenFindMaxThrows_shouldReleaseLock() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(lockKey), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(true);
        when(vouchRepository.findMaxVouchNo("01", "001", "2026", "05"))
                .thenThrow(new RuntimeException("DB error"));

        assertThrows(RuntimeException.class,
                () -> generator.nextVouchNoWithLock("01", "001", "2026", "05"));
        verify(redisTemplate).delete(lockKey);
    }

    @Test
    void releaseLock_shouldDeleteRedisKey() {
        String lockKey = "oes:vouch:no:01:001:2026:05";
        generator.releaseLock("01", "001", "2026", "05");
        verify(redisTemplate).delete(lockKey);
    }

    @Test
    void nextVouchNoWithOptimisticLock_whenFirstUse_shouldInitAndReturn1() {
        when(vouchNoSeqRepository.getVersion("01", "001", "2026", "05")).thenReturn(0);
        when(vouchNoSeqRepository.incrementAndGet("01", "001", "2026", "05", 0)).thenReturn(1);
        when(vouchNoSeqRepository.getCurrentNo("01", "001", "2026", "05")).thenReturn(1);

        int result = generator.nextVouchNoWithOptimisticLock("01", "001", "2026", "05");

        assertEquals(1, result);
        verify(vouchNoSeqRepository).initIfAbsent("01", "001", "2026", "05");
    }

    @Test
    void nextVouchNoWithOptimisticLock_whenConflict_shouldRetryAndSucceed() {
        doNothing().when(vouchNoSeqRepository).initIfAbsent("01", "001", "2026", "05");
        when(vouchNoSeqRepository.getVersion("01", "001", "2026", "05")).thenReturn(0);
        when(vouchNoSeqRepository.incrementAndGet("01", "001", "2026", "05", 0))
                .thenReturn(0) // first attempt fails
                .thenReturn(1); // second attempt succeeds
        when(vouchNoSeqRepository.getCurrentNo("01", "001", "2026", "05")).thenReturn(5);

        int result = generator.nextVouchNoWithOptimisticLock("01", "001", "2026", "05");

        assertEquals(5, result);
    }

    @Test
    void nextVouchNoWithOptimisticLock_whenAllRetriesExhausted_shouldThrow() {
        when(vouchNoSeqRepository.getVersion("01", "001", "2026", "05")).thenReturn(0);
        when(vouchNoSeqRepository.incrementAndGet("01", "001", "2026", "05", 0)).thenReturn(0);

        assertThrows(OptimisticLockException.class,
                () -> generator.nextVouchNoWithOptimisticLock("01", "001", "2026", "05"));
    }

    @Test
    void nextVouchNoWithOptimisticLock_whenVersionIsNull_shouldThrow() {
        when(vouchNoSeqRepository.getVersion("01", "001", "2026", "05")).thenReturn(null);

        assertThrows(BusinessException.class,
                () -> generator.nextVouchNoWithOptimisticLock("01", "001", "2026", "05"));
    }

    @Test
    void nextVouchNoWithOptimisticLock_whenGetCurrentNoNull_shouldReturnOne() {
        when(vouchNoSeqRepository.getVersion("01", "001", "2026", "05")).thenReturn(0);
        when(vouchNoSeqRepository.incrementAndGet("01", "001", "2026", "05", 0)).thenReturn(1);
        when(vouchNoSeqRepository.getCurrentNo("01", "001", "2026", "05")).thenReturn(null);

        int result = generator.nextVouchNoWithOptimisticLock("01", "001", "2026", "05");

        assertEquals(1, result);
    }

    @Test
    void buildLockKey_shouldUseCorrectFormat() {
        String expected = "oes:vouch:no:01:001:2026:05";
        when(valueOps.setIfAbsent(eq(expected), eq("locked"), eq(10000L), eq(TimeUnit.MILLISECONDS)))
                .thenReturn(true);
        when(vouchRepository.findMaxVouchNo("01", "001", "2026", "05"))
                .thenReturn(Optional.of(0));

        int result = generator.nextVouchNoWithLock("01", "001", "2026", "05");
        assertEquals(1, result);
    }
}
