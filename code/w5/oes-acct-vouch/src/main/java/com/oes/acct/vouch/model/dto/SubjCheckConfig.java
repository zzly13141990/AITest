package com.oes.acct.vouch.model.dto;

public record SubjCheckConfig(
    String acctSubjCode,
    String acctSubjName,
    String acctSubjNameAll,
    String isCheck,
    String isBudg,
    java.util.List<CheckTypeInfo> checks,
    java.util.List<OtherFzhsInfo> otherFzhsChecks
) {
    public record CheckTypeInfo(
        Integer checkId,
        String checkName,
        String tableId,
        Integer checkIndex
    ) {}

    public record OtherFzhsInfo(
        Integer otherFzhsIdx,
        String checkTypeName,
        String inputType,
        String dictType,
        String dictName,
        Integer isShow,
        Integer isRequire,
        String displayName
    ) {}
}
