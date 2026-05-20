package com.oes.acct.vouch.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class OptimisticLockExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        OptimisticLockException ex = new OptimisticLockException("乐观锁冲突");
        assertEquals("乐观锁冲突", ex.getMessage());
    }

    @Test
    void constructor_shouldBeRuntimeException() {
        OptimisticLockException ex = new OptimisticLockException("test");
        assertInstanceOf(RuntimeException.class, ex);
    }
}
