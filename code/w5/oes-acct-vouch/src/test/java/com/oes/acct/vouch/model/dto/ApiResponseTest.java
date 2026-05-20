package com.oes.acct.vouch.model.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    void success_shouldReturnCode0AndData() {
        ApiResponse<String> resp = ApiResponse.success("hello");
        assertEquals(0, resp.code());
        assertEquals("success", resp.message());
        assertEquals("hello", resp.data());
    }

    @Test
    void successWithMessage_shouldUseCustomMessage() {
        ApiResponse<Integer> resp = ApiResponse.success("自定义消息", 42);
        assertEquals(0, resp.code());
        assertEquals("自定义消息", resp.message());
        assertEquals(42, resp.data());
    }

    @Test
    void error_shouldReturnGivenCodeAndMessage() {
        ApiResponse<Void> resp = ApiResponse.error(1001, "借贷不平衡");
        assertEquals(1001, resp.code());
        assertEquals("借贷不平衡", resp.message());
        assertNull(resp.data());
    }

    @Test
    void error_withNullData_shouldBeNull() {
        ApiResponse<String> resp = ApiResponse.error(9999, "系统错误");
        assertNull(resp.data());
    }

    @Test
    void record_shouldPreserveAllComponents() {
        ApiResponse<String> resp = new ApiResponse<>(1, "msg", "data");
        assertEquals(1, resp.code());
        assertEquals("msg", resp.message());
        assertEquals("data", resp.data());
    }
}
