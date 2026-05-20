package com.oes.acct.vouch.exception;

import com.oes.acct.vouch.model.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@RestController
class StubController {
    @GetMapping("/throw/business")
    public void throwBusiness() {
        throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "凭证数据无效");
    }

    @GetMapping("/throw/optimistic")
    public void throwOptimistic() {
        throw new OptimisticLockException("凭证号冲突");
    }

    @GetMapping("/throw/dataaccess")
    public void throwDataAccess() {
        throw new DataAccessException("DB connection failed") {};
    }

    @GetMapping("/throw/generic")
    public void throwGeneric() {
        throw new RuntimeException("未知错误");
    }
}

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StubController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void handleBusinessException_shouldReturn400WithErrorCode() throws Exception {
        mockMvc.perform(get("/throw/business")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCH_DATA_INVALID.getCode()))
                .andExpect(jsonPath("$.message").value("凭证数据无效"));
    }

    @Test
    void handleBusinessException_shouldNotReturnSuccess() throws Exception {
        var result = mockMvc.perform(get("/throw/business"))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        assertTrue(content.contains("\"code\":"));
        // code should NOT be 0 (success)
        assertFalse(content.contains("\"code\":0"));
    }

    @Test
    void handleOptimisticLockException_shouldReturn409() throws Exception {
        mockMvc.perform(get("/throw/optimistic")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.VOUCH_NO_CONFLICT.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.VOUCH_NO_CONFLICT.getMessage()));
    }

    @Test
    void handleDataAccessException_shouldReturn500() throws Exception {
        mockMvc.perform(get("/throw/dataaccess")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(ErrorCode.DB_EXCEPTION.getCode()))
                .andExpect(jsonPath("$.message").value("数据库操作失败"));
    }

    @Test
    void handleGenericException_shouldReturn500() throws Exception {
        mockMvc.perform(get("/throw/generic")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(ErrorCode.SYSTEM_ERROR.getCode()))
                .andExpect(jsonPath("$.message").value("系统内部错误"));
    }

    @Test
    void apiResponse_error_shouldCreateCorrectResponse() {
        ApiResponse<Void> response = ApiResponse.error(1001, "test error");
        assertEquals(1001, response.code());
        assertEquals("test error", response.message());
        assertNull(response.data());
    }
}
