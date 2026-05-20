package com.oes.acct.vouch.model.dto;

public record CascadeValueResult(
    Integer attrId,
    String attrTableId,
    String attrFieldCode,
    String attrShowName,
    Integer targetOtherFzhsIdx,
    CascadeValue cascadeValue
) {
    public record CascadeValue(
        String id,
        String name,
        String code
    ) {}
}
