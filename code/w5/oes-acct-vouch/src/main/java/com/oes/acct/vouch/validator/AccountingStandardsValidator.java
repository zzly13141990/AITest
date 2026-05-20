package com.oes.acct.vouch.validator;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.model.dto.VouchSaveRequest;
import com.oes.acct.vouch.model.entity.AcctSubj;
import com.oes.acct.vouch.model.entity.AcctSubjOtherFzSetting;
import com.oes.acct.vouch.repository.OtherFzSettingRepository;
import com.oes.acct.vouch.repository.SubjRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class AccountingStandardsValidator {

    private static final Logger log = LoggerFactory.getLogger(AccountingStandardsValidator.class);

    private final List<ValidationRule> rules;
    private final SubjRepository subjRepository;
    private final OtherFzSettingRepository otherFzSettingRepository;

    @Value("${oes.acct.vouch.validation.balance-tolerance:0.01}")
    private BigDecimal balanceTolerance = new BigDecimal("0.01");

    @Value("${oes.acct.vouch.validation.enabled:true}")
    private boolean validationEnabled = true;

    public AccountingStandardsValidator(SubjRepository subjRepository,
                                        OtherFzSettingRepository otherFzSettingRepository) {
        this.subjRepository = subjRepository;
        this.otherFzSettingRepository = otherFzSettingRepository;
        this.rules = List.of(
                this::validateRequiredFields,
                this::validateDetailNonEmpty,
                this::validateAmountFormat,
                this::validateBalance,
                this::validateCheckCompleteness,
                this::validateOtherFzhsRequire,
                this::validateCheckAmountConsistency,
                this::validateSubjectLeaf,
                this::validateCombinationUniqueness,
                this::validateDateInPeriod,
                this::validateAttachmentCount,
                this::validateVouchType
        );
    }

    @FunctionalInterface
    public interface ValidationRule {
        void validate(VouchSaveRequest request);
    }

    public void validate(VouchSaveRequest request) {
        if (!validationEnabled) {
            log.debug("Validation disabled, skipping");
            return;
        }

        for (ValidationRule rule : rules) {
            rule.validate(request);
        }
    }

    // Level 1: Basic Data Validation
    private void validateRequiredFields(VouchSaveRequest request) {
        VouchSaveRequest.VouchMain vouch = request.vouch();
        if (vouch.compCode() == null || vouch.compCode().isBlank()) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "单位编码不能为空");
        }
        if (vouch.copyCode() == null || vouch.copyCode().isBlank()) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "账套编码不能为空");
        }
        if (vouch.acctYear() == null || vouch.acctYear().isBlank()) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "会计年度不能为空");
        }
        if (vouch.acctMonth() == null || vouch.acctMonth().isBlank()) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "会计月份不能为空");
        }
        if (vouch.vouchDate() == null) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "凭证日期不能为空");
        }
        if (vouch.vouchTypeId() == null) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "凭证类型不能为空");
        }
    }

    private void validateDetailNonEmpty(VouchSaveRequest request) {
        if (request.details() == null || request.details().isEmpty()) {
            throw new BusinessException(ErrorCode.DETAIL_EMPTY, "分录不能为空");
        }
    }

    private void validateAmountFormat(VouchSaveRequest request) {
        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            BigDecimal debit = detail.amtDebit() != null ? detail.amtDebit() : BigDecimal.ZERO;
            BigDecimal credit = detail.amtCredit() != null ? detail.amtCredit() : BigDecimal.ZERO;

            if (debit.compareTo(BigDecimal.ZERO) < 0 || credit.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException(ErrorCode.AMOUNT_INVALID, "第" + (i + 1) + "行分录金额不能为负数");
            }

            if (debit.scale() > 2 || credit.scale() > 2) {
                throw new BusinessException(ErrorCode.AMOUNT_INVALID, "第" + (i + 1) + "行分录金额最多两位小数");
            }
        }
    }

    // Level 2: Accounting Standards Validation
    private void validateBalance(VouchSaveRequest request) {
        VouchSaveRequest.VouchMain vouch = request.vouch();
        BigDecimal finDebit = BigDecimal.ZERO, finCredit = BigDecimal.ZERO;
        BigDecimal budgDebit = BigDecimal.ZERO, budgCredit = BigDecimal.ZERO;

        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            if (detail.acctSubjCode() == null || detail.acctSubjCode().isBlank()) continue;
            AcctSubj subj = subjRepository.findByCode(detail.acctSubjCode(), vouch.compCode(),
                    vouch.copyCode(), vouch.acctYear());
            if (subj == null) continue;
            BigDecimal debit = detail.amtDebit() != null ? detail.amtDebit() : BigDecimal.ZERO;
            BigDecimal credit = detail.amtCredit() != null ? detail.amtCredit() : BigDecimal.ZERO;
            if ("1".equals(subj.getIsBudge())) {
                budgDebit = budgDebit.add(debit);
                budgCredit = budgCredit.add(credit);
            } else {
                finDebit = finDebit.add(debit);
                finCredit = finCredit.add(credit);
            }
        }

        BigDecimal finDiff = finDebit.subtract(finCredit).abs();
        if (finDiff.compareTo(balanceTolerance) > 0) {
            throw new BusinessException(ErrorCode.IMBALANCE,
                    String.format("财务分录借贷不平衡: 借方合计=%s, 贷方合计=%s, 差额=%s", finDebit, finCredit, finDiff));
        }
        BigDecimal budgDiff = budgDebit.subtract(budgCredit).abs();
        if (budgDiff.compareTo(balanceTolerance) > 0) {
            throw new BusinessException(ErrorCode.IMBALANCE,
                    String.format("预算分录借贷不平衡: 借方合计=%s, 贷方合计=%s, 差额=%s", budgDebit, budgCredit, budgDiff));
        }
    }

    /**
     * PRD §4.6: Validate standard check completeness.
     * Only applies to check items with checkItemType="standard" (Line=1).
     */
    private void validateCheckCompleteness(VouchSaveRequest request) {
        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            if (detail.checkItems() != null && !detail.checkItems().isEmpty()) {
                for (VouchSaveRequest.CheckItem item : detail.checkItems()) {
                    // Only validate standard checks (Line=1 in v2.1 model)
                    if (!"other".equals(item.checkItemType())) {
                        Map<Integer, Integer> cv = item.checkValues();
                        boolean hasCheckValue = cv != null && !cv.isEmpty();
                        if (!hasCheckValue) {
                            throw new BusinessException(ErrorCode.CHECK_REQUIRED_MISSING,
                                    "第" + (i + 1) + "行分录辅助核算值不能为空");
                        }
                    }
                }
            }
        }
    }

    /**
     * Validate other fzhs (info_fzhs1~5) require fields.
     * Check against acct_subj_other_fz_setting.is_require configuration.
     * In multi-row format, each CheckItem may contain both standard and other fzhs values.
     */
    private void validateOtherFzhsRequire(VouchSaveRequest request) {
        VouchSaveRequest.VouchMain vouch = request.vouch();
        if (vouch == null) return;

        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            if (detail.checkItems() != null && detail.acctSubjCode() != null) {
                List<AcctSubjOtherFzSetting> settings = otherFzSettingRepository
                        .findVisibleBySubject(detail.acctSubjCode(), vouch.compCode(),
                                vouch.copyCode(), vouch.acctYear());

                for (AcctSubjOtherFzSetting setting : settings) {
                    if (setting.getIsRequire() != null && setting.getIsRequire() == 1) {
                        int idx = setting.getOtherFzhsIdx();
                        boolean hasValue = false;
                        for (VouchSaveRequest.CheckItem item : detail.checkItems()) {
                            // Check all items regardless of type (multi-row: all items are "standard")
                            String value = switch (idx) {
                                case 1 -> item.infoFzhs1();
                                case 2 -> item.infoFzhs2();
                                case 3 -> item.infoFzhs3();
                                case 4 -> item.infoFzhs4();
                                case 5 -> item.infoFzhs5();
                                default -> null;
                            };
                            if (value != null && !value.isBlank()) {
                                hasValue = true;
                                break;
                            }
                        }
                        if (!hasValue) {
                            throw new BusinessException(ErrorCode.CHECK_REQUIRED_MISSING,
                                    "第" + (i + 1) + "行分录其他辅助核算(索引" + idx + ")为必填项");
                        }
                    }
                }
            }
        }
    }

    /**
     * Validate subject is leaf level by querying database.
     */
    private void validateSubjectLeaf(VouchSaveRequest request) {
        VouchSaveRequest.VouchMain vouch = request.vouch();
        if (vouch == null) return;

        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            if (detail.acctSubjCode() != null && !detail.acctSubjCode().isBlank()) {
                boolean isLeaf = subjRepository.isLeafSubject(
                        detail.acctSubjCode(), vouch.compCode(),
                        vouch.copyCode(), vouch.acctYear());
                if (!isLeaf) {
                    throw new BusinessException(ErrorCode.SUBJECT_NOT_LEAF,
                            "第" + (i + 1) + "行分录科目 " + detail.acctSubjCode() + " 非末级科目");
                }
            }
        }
    }

    private void validateCombinationUniqueness(VouchSaveRequest request) {
        Set<String> combinations = new HashSet<>();
        for (VouchSaveRequest.VouchDetail detail : request.details()) {
            String key = detail.acctSubjCode();
            if (detail.checkItems() != null) {
                for (VouchSaveRequest.CheckItem item : detail.checkItems()) {
                    if (item.checkValues() != null) {
                        key += "|" + item.checkValues().toString();
                    }
                }
            }
            if (!combinations.add(key)) {
                throw new BusinessException(ErrorCode.DUPLICATE_COMBINATION,
                        "分录科目+辅助核算组合重复: " + detail.acctSubjCode());
            }
        }
    }

    // Level 3: Business Compliance Validation
    private void validateDateInPeriod(VouchSaveRequest request) {
        VouchSaveRequest.VouchMain vouch = request.vouch();
        if (vouch.vouchDate() != null && vouch.acctYear() != null && vouch.acctMonth() != null) {
            int year = vouch.vouchDate().getYear();
            int month = vouch.vouchDate().getMonthValue();
            String expectedYear = String.valueOf(year);
            String expectedMonth = String.format("%02d", month);

            if (!expectedYear.equals(vouch.acctYear()) || !expectedMonth.equals(vouch.acctMonth())) {
                throw new BusinessException(ErrorCode.DATE_OUT_OF_RANGE,
                        "凭证日期 " + vouch.vouchDate().toLocalDate() +
                        " 不在会计期间 " + vouch.acctYear() + "-" + vouch.acctMonth() + " 内");
            }
        }
    }

    private void validateAttachmentCount(VouchSaveRequest request) {
        if (request.vouch().vouchBillNum() != null && request.vouch().vouchBillNum() < 0) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "附件张数不能为负数");
        }
    }

    private void validateVouchType(VouchSaveRequest request) {
        if (request.vouch().vouchTypeId() == null || request.vouch().vouchTypeId() <= 0) {
            throw new BusinessException(ErrorCode.VOUCH_DATA_INVALID, "无效的凭证类型ID");
        }
    }

    /**
     * Validate that each detail's amount matches the sum of its checkItems' amounts.
     */
    private void validateCheckAmountConsistency(VouchSaveRequest request) {
        for (int i = 0; i < request.details().size(); i++) {
            VouchSaveRequest.VouchDetail detail = request.details().get(i);
            if (detail.checkItems() == null || detail.checkItems().isEmpty()) continue;

            BigDecimal totalCheckDebit = BigDecimal.ZERO;
            BigDecimal totalCheckCredit = BigDecimal.ZERO;

            for (VouchSaveRequest.CheckItem item : detail.checkItems()) {
                if (item.amtDebit() != null) {
                    totalCheckDebit = totalCheckDebit.add(item.amtDebit());
                }
                if (item.amtCredit() != null) {
                    totalCheckCredit = totalCheckCredit.add(item.amtCredit());
                }
            }

            // Only validate if checkItems have amounts
            if (totalCheckDebit.compareTo(BigDecimal.ZERO) > 0 || totalCheckCredit.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal detailDebit = detail.amtDebit() != null ? detail.amtDebit() : BigDecimal.ZERO;
                BigDecimal detailCredit = detail.amtCredit() != null ? detail.amtCredit() : BigDecimal.ZERO;

                boolean debitMatch = totalCheckDebit.subtract(detailDebit).abs().compareTo(balanceTolerance) <= 0;
                boolean creditMatch = totalCheckCredit.subtract(detailCredit).abs().compareTo(balanceTolerance) <= 0;

                if (!debitMatch || !creditMatch) {
                    BigDecimal detailAmt = detailDebit.compareTo(BigDecimal.ZERO) > 0 ? detailDebit : detailCredit;
                    BigDecimal checkAmt = totalCheckDebit.compareTo(BigDecimal.ZERO) > 0 ? totalCheckDebit : totalCheckCredit;
                    throw new BusinessException(ErrorCode.CHECK_AMOUNT_MISMATCH,
                            "第" + (i + 1) + "行分录：辅助核算金额与分录金额不一致" +
                            "（分录：" + detailAmt + " ，辅助核算：" + checkAmt + " ）");
                }
            }
        }
    }
}
