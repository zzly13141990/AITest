package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.annotation.OperationLog;
import com.oes.acct.vouch.model.dto.ApiResponse;
import com.oes.acct.vouch.model.dto.NavigationResult;
import com.oes.acct.vouch.service.NavigationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/oes-acct-vouch")
public class NavigationController {

    private static final Logger log = LoggerFactory.getLogger(NavigationController.class);

    private final NavigationService navigationService;

    public NavigationController(NavigationService navigationService) {
        this.navigationService = navigationService;
    }

    /**
     * Navigate to previous or next voucher.
     */
    @GetMapping("/navigation")
    @OperationLog(operation = "凭证导航", module = "凭证管理")
    public ApiResponse<NavigationResult> navigate(
            @RequestParam(required = false) Long vouchId,
            @RequestParam(defaultValue = "next") String direction,
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear,
            @RequestParam(defaultValue = "05") String acctMonth,
            @RequestParam(required = false) Integer vouchNo) {

        log.info("凭证导航: vouchId={}, direction={}", vouchId, direction);
        NavigationResult result = navigationService.navigate(vouchId, direction, compCode, copyCode,
                acctYear, acctMonth, vouchNo);
        return ApiResponse.success(result);
    }
}
