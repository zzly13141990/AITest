package com.oes.acct.vouch.model.vo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record CheckItemVO(
    Integer acctCheckId,
    Integer line,
    Map<Integer, Integer> checkValues,
    String infoFzhs1,
    String infoFzhs2,
    String infoFzhs3,
    String infoFzhs4,
    String infoFzhs5,
    String orderNo,
    LocalDate orderDate,
    Integer payTypeId,
    String cheqNo,
    String receiptNo,
    String occurDate
) {}
