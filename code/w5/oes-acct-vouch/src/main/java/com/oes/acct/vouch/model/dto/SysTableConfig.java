package com.oes.acct.vouch.model.dto;

public record SysTableConfig(
    String tableId,
    String tableName,
    String idField,
    String codeField,
    String nameField,
    String tableLevel,
    String isYear,
    String yearField,
    String stopField,
    String isLastField
) {}
