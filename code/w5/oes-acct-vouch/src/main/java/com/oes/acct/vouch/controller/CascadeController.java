package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.annotation.OperationLog;
import com.oes.acct.vouch.model.dto.ApiResponse;
import com.oes.acct.vouch.model.dto.CascadeCheckRequest;
import com.oes.acct.vouch.model.dto.CascadeCheckResponse;
import com.oes.acct.vouch.service.CascadeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/oes-acct-vouch")
public class CascadeController {

    private static final Logger log = LoggerFactory.getLogger(CascadeController.class);

    private final CascadeService cascadeService;

    public CascadeController(CascadeService cascadeService) {
        this.cascadeService = cascadeService;
    }

    /**
     * PRD §7.7: Cascade check query.
     * When user selects a check value, auto-fill related check values.
     */
    @PostMapping("/cascade-check")
    @OperationLog(operation = "辅助核算级联查询", module = "辅助核算")
    public ApiResponse<CascadeCheckResponse> cascadeCheck(@RequestBody CascadeCheckRequest request) {
        log.info("辅助核算级联查询: mainTableId={}, mainValueId={}", request.mainTableId(), request.mainValueId());
        CascadeCheckResponse result = cascadeService.cascadeCheck(request);
        return ApiResponse.success(result);
    }
}
