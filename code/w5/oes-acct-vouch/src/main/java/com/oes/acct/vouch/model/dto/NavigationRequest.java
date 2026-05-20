package com.oes.acct.vouch.model.dto;

import jakarta.validation.constraints.NotBlank;

public record NavigationRequest(
    Long vouchId,
    String direction,
    @NotBlank String compCode,
    @NotBlank String copyCode,
    @NotBlank String acctYear,
    @NotBlank String acctMonth,
    Integer vouchNo,
    String account
) {}
