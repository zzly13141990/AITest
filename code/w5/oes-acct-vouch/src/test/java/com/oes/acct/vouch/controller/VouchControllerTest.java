package com.oes.acct.vouch.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.oes.acct.vouch.exception.GlobalExceptionHandler;
import com.oes.acct.vouch.model.dto.*;
import com.oes.acct.vouch.service.VouchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class VouchControllerTest {

    @Mock
    private VouchService vouchService;

    @InjectMocks
    private VouchController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void loadVouch_shouldReturnVouchLoadResponse() throws Exception {
        VouchLoadResponse response = new VouchLoadResponse(
                "create",
                new VouchSaveRequest.VouchMain(null, "01", "001", "2026", "05",
                        null, LocalDateTime.now(), 0, 1, "01",
                        null, null, null, null, 0, null, null, null),
                List.of(),
                new OperatorInfo("admin", "管理员", null, null, null, null, null, null, null, null, null),
                false);

        when(vouchService.loadVouch("admin", null, "01", "001", "2026", "05", null, null))
                .thenReturn(response);

        mockMvc.perform(get("/oes-acct-vouch")
                        .param("account", "admin")
                        .param("compCode", "01")
                        .param("copyCode", "001")
                        .param("acctYear", "2026")
                        .param("acctMonth", "05"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.mode").value("create"));
    }

    @Test
    void loadVouch_withoutOptionalParams_shouldUseDefaults() throws Exception {
        VouchLoadResponse response = new VouchLoadResponse(
                "create",
                new VouchSaveRequest.VouchMain(null, "01", "001", "2026", "05",
                        null, LocalDateTime.now(), 0, 1, "01",
                        null, null, null, null, 0, null, null, null),
                List.of(),
                new OperatorInfo("admin", null, null, null, null, null, null, null, null, null, null),
                false);

        when(vouchService.loadVouch("admin", null, "01", "001", "2026", "05", null, null))
                .thenReturn(response);

        mockMvc.perform(get("/oes-acct-vouch")
                        .param("account", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void saveVouch_shouldReturnSaveResult() throws Exception {
        SaveVouchResult result = new SaveVouchResult(1L, 42, "保存成功");
        when(vouchService.saveVouch(any(VouchSaveRequest.class), eq("admin")))
                .thenReturn(result);

        VouchSaveRequest request = new VouchSaveRequest(
                new VouchSaveRequest.VouchMain(null, "01", "001", "2026", "05",
                        null, LocalDateTime.of(2026, 5, 15, 10, 0), 2, 1,
                        "01", null, null, null, null, 0, null, null, null),
                List.of(new VouchSaveRequest.VouchDetail(null, 1, 1, "摘要", "1001",
                        BigDecimal.valueOf(100), BigDecimal.ZERO, null)),
                null);

        mockMvc.perform(post("/oes-acct-vouch/save")
                        .param("account", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.vouchId").value(1))
                .andExpect(jsonPath("$.data.vouchNo").value(42));
    }

    @Test
    void saveVouch_withInvalidRequest_shouldReturn400() throws Exception {
        // compCode is blank, which will fail @NotBlank on VouchMain
        VouchSaveRequest invalidRequest = new VouchSaveRequest(
                new VouchSaveRequest.VouchMain(null, "", "001", "2026", "05",
                        null, LocalDateTime.now(), 2, 1,
                        "01", null, null, null, null, 0, null, null, null),
                List.of(),
                null);

        mockMvc.perform(post("/oes-acct-vouch/save")
                        .param("account", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void saveVouch_withoutAccount_shouldReturn400() throws Exception {
        VouchSaveRequest request = new VouchSaveRequest(
                new VouchSaveRequest.VouchMain(null, "01", "001", "2026", "05",
                        null, LocalDateTime.now(), 2, 1,
                        "01", null, null, null, null, 0, null, null, null),
                List.of(),
                null);

        mockMvc.perform(post("/oes-acct-vouch/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
