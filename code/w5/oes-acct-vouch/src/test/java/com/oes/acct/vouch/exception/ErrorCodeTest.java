package com.oes.acct.vouch.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ErrorCodeTest {

    @Test
    void success_shouldBeCode0() {
        assertEquals(0, ErrorCode.SUCCESS.getCode());
        assertEquals("成功", ErrorCode.SUCCESS.getMessage());
    }

    @Test
    void imbalance_shouldBeCode1001() {
        assertEquals(1001, ErrorCode.IMBALANCE.getCode());
    }

    @Test
    void vouchDataInvalid_shouldBeCode1002() {
        assertEquals(1002, ErrorCode.VOUCH_DATA_INVALID.getCode());
    }

    @Test
    void detailEmpty_shouldBeCode1003() {
        assertEquals(1003, ErrorCode.DETAIL_EMPTY.getCode());
    }

    @Test
    void checkRequiredMissing_shouldBeCode1004() {
        assertEquals(1004, ErrorCode.CHECK_REQUIRED_MISSING.getCode());
    }

    @Test
    void dbException_shouldBeCode1005() {
        assertEquals(1005, ErrorCode.DB_EXCEPTION.getCode());
    }

    @Test
    void paramInvalid_shouldBeCode1006() {
        assertEquals(1006, ErrorCode.PARAM_INVALID.getCode());
    }

    @Test
    void vouchNotFound_shouldBeCode1007() {
        assertEquals(1007, ErrorCode.VOUCH_NOT_FOUND.getCode());
    }

    @Test
    void subjectNotLeaf_shouldBeCode1008() {
        assertEquals(1008, ErrorCode.SUBJECT_NOT_LEAF.getCode());
    }

    @Test
    void amountInvalid_shouldBeCode1009() {
        assertEquals(1009, ErrorCode.AMOUNT_INVALID.getCode());
    }

    @Test
    void dateOutOfRange_shouldBeCode1010() {
        assertEquals(1010, ErrorCode.DATE_OUT_OF_RANGE.getCode());
    }

    @Test
    void duplicateCombination_shouldBeCode1011() {
        assertEquals(1011, ErrorCode.DUPLICATE_COMBINATION.getCode());
    }

    @Test
    void vouchNoConflict_shouldBeCode1012() {
        assertEquals(1012, ErrorCode.VOUCH_NO_CONFLICT.getCode());
    }

    @Test
    void systemError_shouldBeCode9999() {
        assertEquals(9999, ErrorCode.SYSTEM_ERROR.getCode());
    }

    @Test
    void allErrorCodes_shouldBeUnique() {
        ErrorCode[] values = ErrorCode.values();
        long distinctCount = java.util.Arrays.stream(values)
                .mapToInt(ErrorCode::getCode)
                .distinct()
                .count();
        assertEquals(values.length, distinctCount, "所有错误码必须唯一");
    }
}
