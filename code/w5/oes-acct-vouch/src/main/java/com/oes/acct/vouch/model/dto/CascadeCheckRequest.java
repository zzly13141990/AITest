package com.oes.acct.vouch.model.dto;

public record CascadeCheckRequest(
    String mainTableId,
    String mainFieldCode,
    Object mainValueId,
    String compCode,
    String copyCode,
    String acctYear
) {}
