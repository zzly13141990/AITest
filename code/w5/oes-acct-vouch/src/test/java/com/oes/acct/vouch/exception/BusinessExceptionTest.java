package com.oes.acct.vouch.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BusinessExceptionTest {

    @Test
    void constructor_withErrorCode_shouldSetMessageFromEnum() {
        BusinessException ex = new BusinessException(ErrorCode.IMBALANCE);
        assertEquals(1001, ex.getCode());
        assertEquals("借贷不平衡", ex.getMessage());
    }

    @Test
    void constructor_withErrorCodeAndMessage_shouldOverrideMessage() {
        BusinessException ex = new BusinessException(ErrorCode.IMBALANCE, "自定义借贷不平衡消息");
        assertEquals(1001, ex.getCode());
        assertEquals("自定义借贷不平衡消息", ex.getMessage());
    }

    @Test
    void constructor_withIntCode_shouldSetCodeAndMessage() {
        BusinessException ex = new BusinessException(9999, "系统内部错误");
        assertEquals(9999, ex.getCode());
        assertEquals("系统内部错误", ex.getMessage());
    }

    @Test
    void constructor_shouldBeRuntimeException() {
        BusinessException ex = new BusinessException(ErrorCode.PARAM_INVALID, "参数错误");
        assertInstanceOf(RuntimeException.class, ex);
    }

    @Test
    void getCode_withErrorCodeEnum_shouldReturnCorrectCode() {
        BusinessException ex = new BusinessException(ErrorCode.VOUCH_NO_CONFLICT, "冲突");
        assertEquals(1012, ex.getCode());
    }
}
