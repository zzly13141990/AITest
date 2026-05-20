package com.oes.acct.vouch.model.dto;

import java.util.List;

public record VouchLoadResponse(
    String mode,
    VouchSaveRequest.VouchMain vouch,
    List<VouchSaveRequest.VouchDetail> details,
    OperatorInfo operatorInfo,
    boolean readonly
) {}
