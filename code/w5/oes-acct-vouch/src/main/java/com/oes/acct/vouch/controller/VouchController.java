package com.oes.acct.vouch.controller;

import com.oes.acct.vouch.annotation.OperationLog;
import com.oes.acct.vouch.model.dto.*;
import com.oes.acct.vouch.model.entity.AcctVouchType;
import com.oes.acct.vouch.service.VouchService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/oes-acct-vouch")
public class VouchController {

    private static final Logger log = LoggerFactory.getLogger(VouchController.class);

    private final VouchService vouchService;

    public VouchController(VouchService vouchService) {
        this.vouchService = vouchService;
    }

    @GetMapping
    @OperationLog(operation = "加载凭证", module = "凭证管理")
    public ApiResponse<VouchLoadResponse> loadVouch(
            @RequestParam String account,
            @RequestParam(required = false) String vouchId,
            @RequestParam(defaultValue = "01") String compCode,
            @RequestParam(defaultValue = "001") String copyCode,
            @RequestParam(defaultValue = "2026") String acctYear,
            @RequestParam(defaultValue = "05") String acctMonth,
            @RequestParam(required = false) String isWatch,
            @RequestParam(required = false) String isAudit) {

        log.info("加载凭证: account={}, vouchId={}, isWatch={}, isAudit={}", account, vouchId, isWatch, isAudit);
        VouchLoadResponse response = vouchService.loadVouch(account, vouchId, compCode, copyCode, acctYear, acctMonth, isWatch, isAudit);
        return ApiResponse.success(response);
    }

    /** 审核凭证 */
    @PostMapping("/audit")
    @OperationLog(operation = "审核凭证", module = "凭证管理")
    public ApiResponse<Void> auditVouch(
            @RequestParam Long vouchId,
            @RequestParam String account) {
        log.info("审核凭证: vouchId={}, account={}", vouchId, account);
        vouchService.auditVouch(vouchId, account);
        return ApiResponse.success("审核成功", null);
    }

    /** 销审凭证 */
    @PostMapping("/unaudit")
    @OperationLog(operation = "销审凭证", module = "凭证管理")
    public ApiResponse<Void> unauditVouch(
            @RequestParam Long vouchId,
            @RequestParam String account) {
        log.info("销审凭证: vouchId={}, account={}", vouchId, account);
        vouchService.unauditVouch(vouchId, account);
        return ApiResponse.success("销审成功", null);
    }

    @GetMapping("/types")
    @OperationLog(operation = "查询凭证字", module = "凭证管理")
    public ApiResponse<List<AcctVouchType>> getVouchTypes() {
        return ApiResponse.success(vouchService.getVouchTypes());
    }

    @PostMapping("/save")
    @OperationLog(operation = "保存凭证", module = "凭证管理")
    public ApiResponse<SaveVouchResult> saveVouch(
            @RequestBody @Valid VouchSaveRequest request,
            @RequestParam(defaultValue = "admin") String account) {

        log.info("保存凭证: account={}, vouchId={}", account, request.vouch().vouchId());
        SaveVouchResult result = vouchService.saveVouch(request, account);
        return ApiResponse.success("保存成功", result);
    }

    @PostMapping("/log/operation")
    public ApiResponse<Void> logOperation(@RequestBody Map<String, String> body,
                                           @RequestParam(defaultValue = "unknown") String account) {
        String operation = body.getOrDefault("operation", "未知操作");
        String module = body.getOrDefault("module", "前端操作");
        String detail = body.getOrDefault("detail", "");
        log.info("前端操作日志: [{}] {} - 操作人: {} - 详情: {}", module, operation, account, detail);
        return ApiResponse.success(null);
    }

    // ===========================
    // Draft (草稿) APIs
    // ===========================

    @PostMapping("/draft/save")
    @OperationLog(operation = "保存草稿", module = "凭证管理")
    public ApiResponse<SaveVouchResult> saveDraft(
            @RequestBody DraftSaveRequest request,
            @RequestParam(defaultValue = "admin") String account) {
        log.info("保存草稿: account={}, draftName={}", account, request.draft().draftName());
        SaveVouchResult result = vouchService.saveDraft(request, account);
        return ApiResponse.success("草稿保存成功", result);
    }

    @PutMapping("/draft/update")
    @OperationLog(operation = "更新草稿", module = "凭证管理")
    public ApiResponse<SaveVouchResult> updateDraft(
            @RequestBody DraftSaveRequest request,
            @RequestParam(defaultValue = "admin") String account) {
        log.info("更新草稿: account={}, draftId={}", account, request.draft().draftId());
        SaveVouchResult result = vouchService.updateDraft(request, account);
        return ApiResponse.success("草稿更新成功", result);
    }

    @GetMapping("/draft/list")
    @OperationLog(operation = "查询草稿列表", module = "凭证管理")
    public ApiResponse<List<DraftListItem>> getDraftList() {
        return ApiResponse.success(vouchService.getDraftList());
    }

    @GetMapping("/draft/load")
    @OperationLog(operation = "加载草稿", module = "凭证管理")
    public ApiResponse<VouchLoadResponse> loadDraft(@RequestParam Long draftId) {
        return ApiResponse.success(vouchService.loadDraft(draftId));
    }

    @DeleteMapping("/draft/delete")
    @OperationLog(operation = "删除草稿", module = "凭证管理")
    public ApiResponse<Void> deleteDraft(@RequestParam Long draftId) {
        vouchService.deleteDraft(draftId);
        return ApiResponse.success("草稿删除成功", null);
    }
}
