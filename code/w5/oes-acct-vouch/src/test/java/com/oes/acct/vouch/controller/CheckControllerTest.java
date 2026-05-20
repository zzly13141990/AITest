package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.exception.GlobalExceptionHandler;
import com.oes.acct.vouch.model.dto.CheckOption;
import com.oes.acct.vouch.model.dto.SubjCheckConfig;
import com.oes.acct.vouch.service.CheckService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CheckControllerTest {

    @Mock
    private CheckService checkService;

    @InjectMocks
    private CheckController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getSubjChecks_shouldReturnCheckConfig() throws Exception {
        SubjCheckConfig config = new SubjCheckConfig(
                "1001", "库存现金", "库存现金", "1", "0",
                List.of(new SubjCheckConfig.CheckTypeInfo(1001, "部门", "sys_dept", 1)),
                List.of());

        when(checkService.resolveSubjChecks("1001", "01", "001", "2026"))
                .thenReturn(config);

        mockMvc.perform(get("/oes-acct-vouch/subj/checks")
                        .param("acctSubjCode", "1001")
                        .param("compCode", "01")
                        .param("copyCode", "001")
                        .param("acctYear", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.acctSubjCode").value("1001"))
                .andExpect(jsonPath("$.data.isCheck").value("1"))
                .andExpect(jsonPath("$.data.checks[0].checkName").value("部门"));
    }

    @Test
    void getCheckOptions_shouldReturnOptions() throws Exception {
        List<CheckOption> options = List.of(
                new CheckOption(1, "D001", "财务部"),
                new CheckOption(2, "D002", "市场部"));

        when(checkService.loadCheckOptions(1001, "01", "001", "2026"))
                .thenReturn(options);

        mockMvc.perform(get("/oes-acct-vouch/check/options")
                        .param("checkId", "1001")
                        .param("compCode", "01")
                        .param("copyCode", "001")
                        .param("acctYear", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].code").value("D001"));
    }

    @Test
    void searchSubjects_shouldReturnResults() throws Exception {
        when(checkService.searchSubjects("100", "01", "001", "2026", 20))
                .thenReturn(List.of());

        mockMvc.perform(get("/oes-acct-vouch/subj/search")
                        .param("keyword", "100")
                        .param("compCode", "01")
                        .param("copyCode", "001")
                        .param("acctYear", "2026")
                        .param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
