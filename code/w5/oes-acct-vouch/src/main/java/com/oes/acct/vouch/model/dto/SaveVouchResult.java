package com.oes.acct.vouch.model.dto;

public record SaveVouchResult(
    Long vouchId,
    Integer vouchNo,
    String message
) {}
