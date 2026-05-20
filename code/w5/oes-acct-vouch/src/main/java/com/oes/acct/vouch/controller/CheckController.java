package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.annotation.OperationLog;
import com.oes.acct.vouch.model.dto.ApiResponse;
import com.oes.acct.vouch.model.dto.CheckOption;
import com.oes.acct.vouch.model.dto.SubjCheckConfig;
import com.oes.acct.vouch.model.entity.AcctSubj;
import com.oes.acct.vouch.service.CheckService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/oes-acct-vouch")
public class CheckController {

    private static final Logger log = LoggerFactory.getLogger(CheckController.class);

    private final CheckService checkService;

    public CheckController(CheckService checkService) {
        this.checkService = checkService;
    }

    /**
     * Get subject check configuration (standard + other fzhs).
     */
    @GetMapping("/subj/checks")
    @OperationLog(operation = "查询科目辅助核算", module = "科目管理")
    public ApiResponse<SubjCheckConfig> getSubjChecks(
            @RequestParam String acctSubjCode,
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear) {

        log.info("查询科目辅助核算配置: acctSubjCode={}", acctSubjCode);
        SubjCheckConfig config = checkService.resolveSubjChecks(acctSubjCode, compCode, copyCode, acctYear);
        return ApiResponse.success(config);
    }

    /**
     * Search subjects by keyword (for autocomplete).
     */
    @GetMapping("/subj/search")
    @OperationLog(operation = "搜索科目", module = "科目管理")
    public ApiResponse<List<AcctSubj>> searchSubjects(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear,
            @RequestParam(defaultValue = "50") int limit) {

        log.info("搜索科目: keyword={}", keyword);
        List<AcctSubj> results = checkService.searchSubjects(keyword, compCode, copyCode, acctYear, limit);
        return ApiResponse.success(results);
    }

    /**
     * Get top N subjects ordered by acct_subj_code (for edit-mode initial load).
     */
    @GetMapping("/subj/top")
    @OperationLog(operation = "加载科目列表", module = "科目管理")
    public ApiResponse<List<AcctSubj>> getTopSubjects(
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear) {

        log.info("加载全部科目");
        List<AcctSubj> results = checkService.getTopSubjects(compCode, copyCode, acctYear);
        return ApiResponse.success(results);
    }

    /**
     * Get check options from archive table.
     */
    @GetMapping("/check/options")
    @OperationLog(operation = "查询辅助核算选项", module = "辅助核算")
    public ApiResponse<List<CheckOption>> getCheckOptions(
            @RequestParam Integer checkId,
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear) {

        log.info("查询辅助核算选项: checkId={}", checkId);
        List<CheckOption> options = checkService.loadCheckOptions(checkId, compCode, copyCode, acctYear);
        return ApiResponse.success(options);
    }
}
