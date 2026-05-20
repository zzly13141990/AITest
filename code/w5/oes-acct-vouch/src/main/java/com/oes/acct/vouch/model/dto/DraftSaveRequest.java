package com.oes.acct.vouch.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 保存草稿请求 DTO
 * 保存草稿不做校验
 */
public record DraftSaveRequest(
    DraftMain draft,
    List<DraftDetail> details
) {
    public record DraftMain(
        Long draftId,
        String draftName,
        String compCode,
        String copyCode,
        String acctYear,
        String acctMonth,
        Integer vouchNo,
        LocalDateTime vouchDate,
        Integer vouchBillNum,
        Integer vouchTypeId,
        String vouchSourceCode,
        String accManager,
        String operator,
        String modifier,
        String teller,
        Integer typeAttr,
        String summary,
        String auditor,
        String poster
    ) {}

    public record DraftDetail(
        Long vouchDetailId,
        Integer vouchPage,
        Integer vouchRow,
        String summary,
        String acctSubjCode,
        BigDecimal amtDebit,
        BigDecimal amtCredit,
        List<DraftCheckItem> checkItems
    ) {}

    public record DraftCheckItem(
        Integer acctCheckId,
        Integer line,
        String checkItemType,
        String summary,
        BigDecimal amtDebit,
        BigDecimal amtCredit,
        Map<Integer, Integer> checkValues,
        Integer otherFzhsIdx,
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
}
