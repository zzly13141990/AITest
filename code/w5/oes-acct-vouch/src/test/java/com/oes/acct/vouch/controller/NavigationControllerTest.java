package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.exception.GlobalExceptionHandler;
import com.oes.acct.vouch.model.dto.NavigationResult;
import com.oes.acct.vouch.service.NavigationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NavigationControllerTest {

    @Mock
    private NavigationService navigationService;

    @InjectMocks
    private NavigationController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void navigate_shouldReturnNavigationResult() throws Exception {
        NavigationResult result = new NavigationResult(2L, 6, true, false);

        when(navigationService.navigate(1L, "next", "01", "001", "2026", "05", 5))
                .thenReturn(result);

        mockMvc.perform(get("/oes-acct-vouch/navigation")
                        .param("vouchId", "1")
                        .param("direction", "next")
                        .param("compCode", "01")
                        .param("copyCode", "001")
                        .param("acctYear", "2026")
                        .param("acctMonth", "05")
                        .param("vouchNo", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.vouchId").value(2))
                .andExpect(jsonPath("$.data.hasNext").value(false))
                .andExpect(jsonPath("$.data.hasPrev").value(true));
    }

    @Test
    void navigate_withMinimalParams_shouldUseDefaults() throws Exception {
        NavigationResult result = new NavigationResult(null, null, false, false);

        when(navigationService.navigate(null, "next", "01", "001", "2026", "05", null))
                .thenReturn(result);

        mockMvc.perform(get("/oes-acct-vouch/navigation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
