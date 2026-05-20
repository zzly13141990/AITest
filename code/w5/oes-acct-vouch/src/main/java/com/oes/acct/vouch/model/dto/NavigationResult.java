package com.oes.acct.vouch.model.dto;

public record NavigationResult(
    Long vouchId,
    Integer vouchNo,
    Boolean hasPrev,
    Boolean hasNext
) {}
