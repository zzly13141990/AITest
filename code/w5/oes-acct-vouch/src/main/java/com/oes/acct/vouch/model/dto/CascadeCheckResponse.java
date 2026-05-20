package com.oes.acct.vouch.model.dto;

import java.util.List;

public record CascadeCheckResponse(
    boolean hasCascade,
    MainInfo mainInfo,
    List<CascadeValueResult> cascadeResults
) {
    public static CascadeCheckResponse noCascade(String mainTableId, Object mainValueId, String mainValueName) {
        return new CascadeCheckResponse(false, new MainInfo(mainTableId, mainValueId, mainValueName), List.of());
    }

    public record MainInfo(
        String mainTableId,
        Object mainValueId,
        String mainValueName
    ) {}
}
