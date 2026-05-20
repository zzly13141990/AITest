package com.oes.acct.vouch.model.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VouchVO(
    Long vouchId,
    String compCode,
    String copyCode,
    String acctYear,
    String acctMonth,
    Integer vouchNo,
    LocalDateTime vouchDate,
    Integer vouchBillNum,
    Integer vouchTypeId,
    String vouchSourceCode,
    String operator,
    String accManager,
    String modifier,
    BigDecimal totalDebit,
    BigDecimal totalCredit
) {}
