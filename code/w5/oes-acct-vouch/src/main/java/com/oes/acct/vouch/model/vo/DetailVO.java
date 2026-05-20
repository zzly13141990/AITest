package com.oes.acct.vouch.model.vo;

import java.math.BigDecimal;
import java.util.List;

public record DetailVO(
    Long vouchDetailId,
    Integer vouchPage,
    Integer vouchRow,
    String summary,
    String acctSubjCode,
    String acctSubjName,
    BigDecimal amtDebit,
    BigDecimal amtCredit,
    List<CheckItemVO> checkItems
) {}
