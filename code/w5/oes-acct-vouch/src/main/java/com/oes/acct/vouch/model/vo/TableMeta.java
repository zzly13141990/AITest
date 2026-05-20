package com.oes.acct.vouch.model.vo;

public record TableMeta(
    String tableId,
    String tableName,
    String primaryKey,
    String codeColumn,
    String nameColumn
) {}
