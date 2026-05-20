package com.oes.acct.vouch.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record VouchSaveRequest(
    @NotNull VouchMain vouch,
    @NotEmpty List<@Valid VouchDetail> details,
    List<Long> deletedDetailIds
) {
    public record VouchMain(
        Long vouchId,
        @NotBlank String compCode,
        @NotBlank String copyCode,
        @NotBlank String acctYear,
        @NotBlank String acctMonth,
        Integer vouchNo,
        @NotNull LocalDateTime vouchDate,
        Integer vouchBillNum,
        @NotNull Integer vouchTypeId,
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

    public record VouchDetail(
        Long vouchDetailId,
        Integer vouchPage,
        Integer vouchRow,
        String summary,
        String acctSubjCode,
        BigDecimal amtDebit,
        BigDecimal amtCredit,
        List<CheckItem> checkItems
    ) {}

    public record CheckItem(
        Integer acctCheckId,
        Integer line,
        // PRD §7.5: "standard" = standard check, "other" = other fzhs
        String checkItemType,
        String summary,
        BigDecimal amtDebit,
        BigDecimal amtCredit,
        // PRD §4.6: checktype{N} N = sys_check_define.check_id
        // key=check_id (1-50), value=selected archive id
        Map<Integer, Integer> checkValues,
        // v2.1: other fzhs index (1~5), only used when checkItemType="other"
        Integer otherFzhsIdx,
        // v2.1: other fzhs values
        String infoFzhs1,
        String infoFzhs2,
        String infoFzhs3,
        String infoFzhs4,
        String infoFzhs5,
        // v2.1: special business fields
        String orderNo,
        LocalDate orderDate,
        Integer payTypeId,
        String cheqNo,
        String receiptNo,
        String occurDate
    ) {}
}
