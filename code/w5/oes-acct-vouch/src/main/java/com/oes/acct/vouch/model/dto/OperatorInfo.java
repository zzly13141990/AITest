package com.oes.acct.vouch.model.dto;

public record OperatorInfo(
    String account,
    String name,
    String userId,
    String empCode,
    Integer empId,
    String empName,
    Integer deptId,
    String deptCode,
    String deptName,
    String deptNameAll,
    String category
) {}
