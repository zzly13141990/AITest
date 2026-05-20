package com.oes.acct.vouch.service;

import com.oes.acct.vouch.model.dto.DraftListItem;
import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.model.dto.*;
import com.oes.acct.vouch.model.entity.*;
import com.oes.acct.vouch.model.entity.AcctVouchType;
import com.oes.acct.vouch.repository.*;
import com.oes.acct.vouch.util.SnowflakeIdGenerator;
import com.oes.acct.vouch.model.entity.AcctVouchDraft;
import com.oes.acct.vouch.model.entity.AcctVouchDetailDraft;
import com.oes.acct.vouch.model.entity.AcctCheckItemsDraft;
import com.oes.acct.vouch.validator.AccountingStandardsValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VouchService {

    private static final Logger log = LoggerFactory.getLogger(VouchService.class);

    private final VouchRepository vouchRepository;
    private final VouchDraftRepository vouchDraftRepository;
    private final VouchDetailDraftRepository vouchDetailDraftRepository;
    private final CheckItemsDraftRepository checkItemsDraftRepository;
    private final VouchDetailRepository detailRepository;
    private final CheckItemsRepository checkItemsRepository;
    private final CheckService checkService;
    private final VouchNoGenerator vouchNoGenerator;
    private final AccountingStandardsValidator validator;
    private final VouchTypeRepository vouchTypeRepository;
    private final YearPeriodRepository yearPeriodRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SnowflakeIdGenerator idGenerator;

    public VouchService(VouchDraftRepository vouchDraftRepository, VouchDetailDraftRepository vouchDetailDraftRepository,
                        CheckItemsDraftRepository checkItemsDraftRepository, VouchRepository vouchRepository, VouchDetailRepository detailRepository,
                        CheckItemsRepository checkItemsRepository, CheckService checkService,
                        VouchNoGenerator vouchNoGenerator, AccountingStandardsValidator validator,
                        VouchTypeRepository vouchTypeRepository, YearPeriodRepository yearPeriodRepository,
                        JdbcTemplate jdbcTemplate,
                        SnowflakeIdGenerator idGenerator) {
        this.vouchRepository = vouchRepository;
        this.detailRepository = detailRepository;
        this.vouchDraftRepository = vouchDraftRepository;
        this.vouchDetailDraftRepository = vouchDetailDraftRepository;
        this.checkItemsDraftRepository = checkItemsDraftRepository;
        this.checkItemsRepository = checkItemsRepository;
        this.checkService = checkService;
        this.vouchNoGenerator = vouchNoGenerator;
        this.validator = validator;
        this.vouchTypeRepository = vouchTypeRepository;
        this.yearPeriodRepository = yearPeriodRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.idGenerator = idGenerator;
    }

    /**
     * Load voucher for editing.
     */
    public VouchLoadResponse loadVouch(String account, String vouchIdStr, String compCode, String copyCode,
                                        String acctYear, String acctMonth,
                                        String isWatch, String isAudit) {
        if (vouchIdStr == null || vouchIdStr.isBlank()) {
            // Create mode
            String accManager = resolveAccManager(compCode, copyCode);
            VouchSaveRequest.VouchMain emptyVouch = new VouchSaveRequest.VouchMain(
                    null, compCode, copyCode, acctYear, acctMonth,
                    null, LocalDateTime.now(), 0, 1, "01",
                    accManager, null, null, null, 0, null,
                    null, null);
            OperatorInfo operatorInfo = resolveOperatorInfo(account);
            return new VouchLoadResponse("create", emptyVouch, List.of(), operatorInfo, false);
        }

        // Edit mode
        Long vouchId = Long.parseLong(vouchIdStr);
        AcctVouch vouch = vouchRepository.findById(vouchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "凭证不存在: " + vouchId));

        VouchSaveRequest.VouchMain vouchMain = new VouchSaveRequest.VouchMain(
                vouch.getVouchId(), vouch.getCompCode(), vouch.getCopyCode(),
                vouch.getAcctYear(), vouch.getAcctMonth(), vouch.getVouchNo(),
                vouch.getVouchDate(), vouch.getVouchBillNum(), vouch.getVouchTypeId(),
                vouch.getVouchSourceCode(), vouch.getAccManager(), vouch.getOperator(),
                vouch.getModifier(), vouch.getTeller(), vouch.getTypeAttr(), null,
                vouch.getAuditor(), vouch.getPoster());

        List<AcctVouchDetail> details = detailRepository.findByVouchId(vouchId);
        List<VouchSaveRequest.VouchDetail> detailDTOs = details.stream()
                .map(this::toVouchDetailDTO)
                .toList();

        OperatorInfo operatorInfo = resolveOperatorInfo(account);

        // === 计算凭证状态和只读标志 ===
        boolean hasPoster = vouch.getPoster() != null && !vouch.getPoster().isBlank();
        boolean hasAuditor = vouch.getAuditor() != null && !vouch.getAuditor().isBlank();

        if (hasPoster) {
            return new VouchLoadResponse("posted", vouchMain, detailDTOs, operatorInfo, true);
        }

        if (hasAuditor) {
            return new VouchLoadResponse("audited", vouchMain, detailDTOs, operatorInfo, true);
        }

        if ("1".equals(isWatch)) {
            return new VouchLoadResponse("view", vouchMain, detailDTOs, operatorInfo, true);
        }

        if ("1".equals(isAudit)) {
            return new VouchLoadResponse("pending_audit", vouchMain, detailDTOs, operatorInfo, true);
        }

        String makerName = vouch.getOperator();
        String currentUserEmpName = resolveEmpName(account);
        // 制单人 != account 对应的 sys_emp.emp_name 时只读
        boolean isMaker = makerName != null && currentUserEmpName != null && makerName.equals(currentUserEmpName);

        if (!isMaker) {
            return new VouchLoadResponse("view", vouchMain, detailDTOs, operatorInfo, true);
        }

        return new VouchLoadResponse("edit", vouchMain, detailDTOs, operatorInfo, false);
    }

    /**
     * Save voucher with three-table transaction.
     */
    @Transactional(rollbackFor = Exception.class)
    public SaveVouchResult saveVouch(VouchSaveRequest request, String account) {
        // 1. Validate
        validator.validate(request);

        VouchSaveRequest.VouchMain vouchMain = request.vouch();
        boolean isNew = (vouchMain.vouchId() == null);

        // Look up acctYear/acctMonth from acct_year_period table using vouchDate
        LocalDate vouchLocalDate = vouchMain.vouchDate().toLocalDate();
        AcctYearPeriod period = yearPeriodRepository.findByDate(
                vouchMain.compCode(), vouchMain.copyCode(), vouchLocalDate)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERIOD_NOT_FOUND,
                        "未发现凭证日期对应的期间，请联系管理员！"));

        if (period.getAccFlag() != null && period.getAccFlag() == 1) {
            throw new BusinessException(ErrorCode.PERIOD_CLOSED,
                    period.getAcctYear() + "年" + period.getAcctMonth() + "月已经结账，禁止录入凭证");
        }

        String acctYearFromDate = period.getAcctYear();
        String acctMonthFromDate = period.getAcctMonth();

        // 2. Resolve operator name
        String operatorName = resolveOperatorName(account);

        // 3. Generate vouch_no for new vouchers
        int vouchNo;
        if (isNew) {
            vouchNo = vouchNoGenerator.nextVouchNoWithLock(
                    vouchMain.compCode(), vouchMain.copyCode(),
                    acctYearFromDate, acctMonthFromDate);
        } else {
            vouchNo = vouchMain.vouchNo() != null ? vouchMain.vouchNo() : 0;
        }

        try {
            // 4. Save or update main voucher
            Long vouchId;
            if (isNew) {
                vouchId = idGenerator.nextVouchId();
                AcctVouch vouch = new AcctVouch();
                vouch.setVouchId(vouchId);
                vouch.setCompCode(vouchMain.compCode());
                vouch.setCopyCode(vouchMain.copyCode());
                vouch.setAcctYear(acctYearFromDate);
                vouch.setAcctMonth(acctMonthFromDate);
                vouch.setVouchNo(vouchNo);
                vouch.setVouchDate(vouchMain.vouchDate());
                vouch.setVouchBillNum(vouchMain.vouchBillNum() != null ? vouchMain.vouchBillNum() : 0);
                vouch.setVouchTypeId(vouchMain.vouchTypeId());
                vouch.setVouchSourceCode(vouchMain.vouchSourceCode() != null ? vouchMain.vouchSourceCode() : "01");
                vouch.setOperator(operatorName);
                vouch.setAccManager(vouchMain.accManager());
                vouch.setModifier(vouchMain.modifier());
                vouch.setTeller(vouchMain.teller());
                vouch.setTypeAttr(vouchMain.typeAttr() != null ? vouchMain.typeAttr() : 0);
                vouch.setIsCheck("0");
                vouch.setIsAcc("0");
                vouch.setIsCancel("0");
                vouch.setIsCx("0");
                vouch.setIsError("0");
                vouch.setPrintNum(0);
                vouch.setIsTell("0");
                vouch.setIsChknot("0");
                vouch.setIsCzbksr(0);
                vouchRepository.insert(vouch);
            } else {
                vouchId = vouchMain.vouchId();
                AcctVouch existing = vouchRepository.findById(vouchId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND));
                existing.setVouchDate(vouchMain.vouchDate());
                existing.setAcctYear(acctYearFromDate);
                existing.setAcctMonth(acctMonthFromDate);
                existing.setVouchBillNum(vouchMain.vouchBillNum());
                existing.setVouchTypeId(vouchMain.vouchTypeId());
                existing.setVouchSourceCode(vouchMain.vouchSourceCode());
                existing.setOperator(operatorName);
                existing.setAccManager(vouchMain.accManager());
                existing.setModifier(vouchMain.modifier());
                existing.setTeller(vouchMain.teller());
                vouchRepository.update(existing);
            }

            // 5. Full replacement: delete all old details + check items, then re-insert
            if (!isNew) {
                checkItemsRepository.deleteByVouchId(vouchId);
                detailRepository.deleteByVouchId(vouchId);
            }

            // 6. Save details with check items
            List<VouchSaveRequest.VouchDetail> details = request.details();
            int pageNum = 1;
            int rowNum = 1;

            for (VouchSaveRequest.VouchDetail detailDTO : details) {
                Long detailId = idGenerator.nextDetailId();

                AcctVouchDetail detail = new AcctVouchDetail();
                detail.setVouchDetailId(detailId);
                detail.setVouchId(vouchId);
                detail.setVouchPage(pageNum);
                detail.setVouchRow(rowNum);
                detail.setSummary(detailDTO.summary());
                detail.setCompCode(vouchMain.compCode());
                detail.setCopyCode(vouchMain.copyCode());
                detail.setAcctYear(acctYearFromDate);
                detail.setAcctMonth(acctMonthFromDate);
                detail.setAcctSubjCode(detailDTO.acctSubjCode());
                detail.setAmtDebit(detailDTO.amtDebit() != null ? detailDTO.amtDebit() : java.math.BigDecimal.ZERO);
                detail.setAmtCredit(detailDTO.amtCredit() != null ? detailDTO.amtCredit() : java.math.BigDecimal.ZERO);
                detailRepository.insert(detail);

                if (detailDTO.checkItems() != null && !detailDTO.checkItems().isEmpty()) {
                    List<AcctCheckItem> items = buildCheckItemEntities(detailDTO.checkItems(), detailId, vouchId, vouchMain, acctYearFromDate, acctMonthFromDate, detailDTO.acctSubjCode());
                    checkItemsRepository.batchInsert(items);
                }

                rowNum++;
            }

            // Release Redis lock after successful INSERT
            if (isNew) {
                vouchNoGenerator.releaseLock(vouchMain.compCode(), vouchMain.copyCode(),
                        acctYearFromDate, acctMonthFromDate);
            }

            log.info("凭证保存成功: vouchId={}, vouchNo={}, account={}", vouchId, vouchNo, account);
            return new SaveVouchResult(vouchId, vouchNo, "保存成功");

        } catch (DataAccessException e) {
            if (isNew) {
                vouchNoGenerator.releaseLock(vouchMain.compCode(), vouchMain.copyCode(),
                        acctYearFromDate, acctMonthFromDate);
            }
            log.error("凭证保存数据库异常: ", e);
            throw new BusinessException(ErrorCode.DB_EXCEPTION, "凭证保存失败: " + e.getMessage());
        }
    }

    /**
     * Build check item entities. Each CheckItem DTO becomes one AcctCheckItem row (multi-row support).
     * Each row has its own line number, summary, amount, standard check values, and other fzhs values.
     */
    private List<AcctCheckItem> buildCheckItemEntities(List<VouchSaveRequest.CheckItem> checkItemDTOs,
                                                        Long detailId, Long vouchId,
                                                        VouchSaveRequest.VouchMain vouchMain,
                                                        String acctYearFromDate, String acctMonthFromDate,
                                                        String acctSubjCode) {
        List<AcctCheckItem> items = new ArrayList<>();

        for (VouchSaveRequest.CheckItem dto : checkItemDTOs) {
            AcctCheckItem row = new AcctCheckItem();
            row.setVouchDetailId(detailId);
            row.setVouchId(vouchId);
            row.setLine(dto.line() != null ? dto.line() : 1);
            row.setCompCode(vouchMain.compCode());
            row.setCopyCode(vouchMain.copyCode());
            row.setAcctYear(acctYearFromDate);
            row.setAcctMonth(acctMonthFromDate);
            row.setAcctSubjCode(acctSubjCode);
            row.setVouchNo(vouchMain.vouchNo());
            row.setVouchDate(vouchMain.vouchDate());
            row.setIsInit("0");

            // Summary and amounts from the DTO
            row.setSummary(dto.summary());
            row.setAmtDebit(dto.amtDebit() != null ? dto.amtDebit() : BigDecimal.ZERO);
            row.setAmtCredit(dto.amtCredit() != null ? dto.amtCredit() : BigDecimal.ZERO);

            // Standard check values (checktype1~50)
            if (dto.checkValues() != null) {
                row.setCheckValuesFromMap(dto.checkValues());
            }

            // Other fzhs values (info_fzhs1~5)
            if (dto.otherFzhsIdx() != null) {
                int fzhsIdx = dto.otherFzhsIdx();
                String fzhsValue = getInfoFzhsValue(dto, fzhsIdx);
                if (fzhsValue != null && !fzhsValue.isBlank()) {
                    row.setInfoFzhs(fzhsIdx, fzhsValue);
                }
            } else {
                // Try all info_fzhs fields
                if (dto.infoFzhs1() != null && !dto.infoFzhs1().isBlank()) {
                    row.setInfoFzhs1(dto.infoFzhs1());
                }
                if (dto.infoFzhs2() != null && !dto.infoFzhs2().isBlank()) {
                    row.setInfoFzhs2(dto.infoFzhs2());
                }
                if (dto.infoFzhs3() != null && !dto.infoFzhs3().isBlank()) {
                    row.setInfoFzhs3(dto.infoFzhs3());
                }
                if (dto.infoFzhs4() != null && !dto.infoFzhs4().isBlank()) {
                    row.setInfoFzhs4(dto.infoFzhs4());
                }
                if (dto.infoFzhs5() != null && !dto.infoFzhs5().isBlank()) {
                    row.setInfoFzhs5(dto.infoFzhs5());
                }
            }

            // Special field mapping
            applySpecialFieldMapping(dto, row, vouchMain);

            items.add(row);
        }

        return items;
    }

    /**
     * PRD §5.4.3, §9.2: Special business field auto-mapping for other fzhs.
     *
     * When other_checktype is:
     *   - 日期 → order_date + occur_date
     *   - 结算方式 → pay_type_id
     *   - 票据号 → cheq_no + order_no
     *   - 回单号 → receipt_no
     */
    private void applySpecialFieldMapping(VouchSaveRequest.CheckItem dto,
                                           AcctCheckItem item,
                                           VouchSaveRequest.VouchMain vouchMain) {
        // Map from DTO fields that frontend sends based on check type
        if (dto.orderDate() != null) {
            item.setOrderDate(dto.orderDate());
            item.setOccurDate(dto.occurDate() != null ? dto.occurDate() : dto.orderDate().toString());
        }
        if (dto.payTypeId() != null) {
            item.setPayTypeId(dto.payTypeId());
        }
        if (dto.cheqNo() != null && !dto.cheqNo().isBlank()) {
            item.setCheqNo(dto.cheqNo());
            item.setOrderNo(dto.orderNo() != null ? dto.orderNo() : dto.cheqNo());
        }
        if (dto.receiptNo() != null && !dto.receiptNo().isBlank()) {
            item.setReceiptNo(dto.receiptNo());
        }

        // Default: if occurDate not set but orderDate is set, sync them
        if (item.getOrderDate() != null && item.getOccurDate() == null) {
            item.setOccurDate(item.getOrderDate().toString());
        }
    }

    /**
     * Extract info_fzhs value from DTO by index (1~5).
     */
    private String getInfoFzhsValue(VouchSaveRequest.CheckItem dto, int idx) {
        return switch (idx) {
            case 1 -> dto.infoFzhs1();
            case 2 -> dto.infoFzhs2();
            case 3 -> dto.infoFzhs3();
            case 4 -> dto.infoFzhs4();
            case 5 -> dto.infoFzhs5();
            default -> null;
        };
    }

    /**
     * Convert entity to detail DTO with check items (for edit mode).
     * Each AcctCheckItem entity becomes one CheckItem DTO (multi-row support).
     */
    private VouchSaveRequest.VouchDetail toVouchDetailDTO(AcctVouchDetail entity) {
        List<AcctCheckItem> checkItems = checkItemsRepository.findByDetailId(entity.getVouchDetailId());
        List<VouchSaveRequest.CheckItem> checkItemDTOs = checkItems.stream()
                .map(item -> {
                    // Each row is "standard" type since it contains both check values and info fzhs values
                    String checkItemType = "standard";
                    Integer otherFzhsIdx = null;
                    // Determine otherFzhsIdx from non-null info_fzhs fields
                    for (int i = 1; i <= 5; i++) {
                        if (item.getInfoFzhs(i) != null && !item.getInfoFzhs(i).isBlank()) {
                            otherFzhsIdx = i;
                            break;
                        }
                    }
                    return new VouchSaveRequest.CheckItem(
                            item.getAcctCheckId(), item.getLine(), checkItemType,
                            item.getSummary(), item.getAmtDebit(), item.getAmtCredit(),
                            item.getCheckValuesAsMap(),
                            otherFzhsIdx,
                            item.getInfoFzhs1(), item.getInfoFzhs2(),
                            item.getInfoFzhs3(), item.getInfoFzhs4(), item.getInfoFzhs5(),
                            item.getOrderNo(), item.getOrderDate(),
                            item.getPayTypeId(), item.getCheqNo(),
                            item.getReceiptNo(), item.getOccurDate());
                })
                .toList();

        return new VouchSaveRequest.VouchDetail(
                entity.getVouchDetailId(), entity.getVouchPage(), entity.getVouchRow(),
                entity.getSummary(), entity.getAcctSubjCode(),
                entity.getAmtDebit(), entity.getAmtCredit(), checkItemDTOs);
    }

    /**
     * Get all voucher types from acct_vouch_type dictionary.
     */
    public List<AcctVouchType> getVouchTypes() {
        return vouchTypeRepository.findAll();
    }

    /**
     * Resolve operator name from account.
     */
    public String resolveOperatorName(String account) {
        if (account == null || account.isBlank()) return null;
        try {
            String sql = """
                SELECT ISNULL(u.NAME, e.emp_name) FROM up_org_user u
                LEFT JOIN sys_emp e ON u.emp_code = e.emp_code
                WHERE u.ACCOUNT = ?
                """;
            return jdbcTemplate.queryForObject(sql, String.class, account);
        } catch (DataAccessException e) {
            log.warn("Failed to resolve operator name for account={}", account);
            return account;
        }
    }

    /**
     * Resolve operator info (user + employee + department).
     */
    public OperatorInfo resolveOperatorInfo(String account) {
        if (account == null || account.isBlank()) {
            return new OperatorInfo(account, null, null, null, null, null, null, null, null, null, null);
        }

        try {
            String sql = """
                SELECT u.ACCOUNT, u.NAME, u.ID as userId, u.emp_code,
                       e.emp_id, e.emp_name, e.dept_id,
                       d.dept_code, d.dept_name, d.dept_name_all, e.category
                FROM up_org_user u
                LEFT JOIN sys_emp e ON u.emp_code = e.emp_code
                LEFT JOIN sys_dept d ON e.dept_id = d.dept_id
                WHERE u.ACCOUNT = ?
                """;
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new OperatorInfo(
                    rs.getString("ACCOUNT"),
                    rs.getString("NAME"),
                    rs.getString("userId"),
                    rs.getString("emp_code"),
                    rs.getInt("emp_id"),
                    rs.getString("emp_name"),
                    rs.getInt("dept_id"),
                    rs.getString("dept_code"),
                    rs.getString("dept_name"),
                    rs.getString("dept_name_all"),
                    rs.getString("category")
            ), account);
        } catch (DataAccessException e) {
            log.warn("Failed to resolve operator info for account={}", account);
            return new OperatorInfo(account, null, null, null, null, null, null, null, null, null, null);
        }
    }

    /**
     * Resolve sys_emp.emp_name for a given account.
     */
    private String resolveEmpName(String account) {
        if (account == null || account.isBlank()) return null;
        try {
            String sql = """
                SELECT e.emp_name FROM up_org_user u
                LEFT JOIN sys_emp e ON u.emp_code = e.emp_code
                WHERE u.ACCOUNT = ?
                """;
            return jdbcTemplate.queryForObject(sql, String.class, account);
        } catch (DataAccessException e) {
            log.warn("Failed to resolve emp name for account={}", account);
            return null;
        }
    }

    /**
     * Resolve acc_manager from up_org_unit table for new voucher creation.
     */
    private String resolveAccManager(String compCode, String copyCode) {
        if (compCode == null || compCode.isBlank()) return null;
        try {
            String sql = """
                SELECT TOP 1 acc_manager FROM up_org_unit
                WHERE comp_code = ? AND copy_code = ?
                AND acc_manager IS NOT NULL AND acc_manager != ''
                ORDER BY unit_code
                """;
            return jdbcTemplate.queryForObject(sql, String.class, compCode, copyCode);
        } catch (DataAccessException e) {
            log.warn("Failed to resolve acc_manager for compCode={}, copyCode={}", compCode, copyCode);
            return null;
        }
    }

    // ===============================
    // Draft (草稿) Services
    // ===============================

    /**
     * 保存草稿 - 不做校验，直接保存
     */
    @Transactional(rollbackFor = Exception.class)
    public SaveVouchResult saveDraft(DraftSaveRequest request, String account) {
        DraftSaveRequest.DraftMain draftMain = request.draft();
        String operatorName = resolveOperatorName(account);
        LocalDateTime now = LocalDateTime.now();

        AcctVouchDraft draft = new AcctVouchDraft();
        draft.setVouchRemark(draftMain.draftName());
        draft.setCompCode(draftMain.compCode());
        draft.setCopyCode(draftMain.copyCode());
        draft.setAcctYear(draftMain.acctYear());
        draft.setAcctMonth(draftMain.acctMonth());
        draft.setVouchNo(draftMain.vouchNo() != null ? draftMain.vouchNo() : 0);
        draft.setVouchDate(draftMain.vouchDate() != null ? draftMain.vouchDate() : LocalDateTime.now());
        draft.setVouchBillNum(draftMain.vouchBillNum() != null ? draftMain.vouchBillNum() : 0);
        draft.setVouchTypeId(draftMain.vouchTypeId() != null ? draftMain.vouchTypeId() : 0);
        draft.setVouchSourceCode("01");
        draft.setOperator(operatorName);
        draft.setAccManager(draftMain.accManager());
        draft.setModifier(draftMain.modifier());
        draft.setTeller(draftMain.teller());
        draft.setTypeAttr(0);
        draft.setIsCheck("0");
        draft.setIsAcc("0");
        draft.setIsCancel("0");
        draft.setIsCx("0");
        draft.setIsError("0");
        draft.setPrintNum(0);
        draft.setIsAuto(0);
        draft.setIsTell("0");
        draft.setIsChknot("0");
        draft.setIsTemplet("0");
        draft.setGroupName("默认分组");
        Integer draftId = vouchDraftRepository.insert(draft);
        Long draftIdLong = draftId.longValue();
        log.info("草稿保存成功: draftId={}, draftName={}, account={}", draftId, draftMain.draftName(), account);

        if (request.details() != null && !request.details().isEmpty()) {
            int pageNum = 1;
            int rowNum = 1;
            for (DraftSaveRequest.DraftDetail detailDTO : request.details()) {
                boolean isEmpty = (detailDTO.summary() == null || detailDTO.summary().isBlank())
                    && detailDTO.acctSubjCode() == null
                    && (detailDTO.amtDebit() == null || detailDTO.amtDebit().compareTo(java.math.BigDecimal.ZERO) == 0)
                    && (detailDTO.amtCredit() == null || detailDTO.amtCredit().compareTo(java.math.BigDecimal.ZERO) == 0);
                if (isEmpty) continue;

                AcctVouchDetailDraft detail = new AcctVouchDetailDraft();
                detail.setVouchId(draftIdLong);
                detail.setVouchPage(pageNum);
                detail.setVouchRow(rowNum);
                detail.setSummary(detailDTO.summary());
                detail.setCompCode(draftMain.compCode());
                detail.setCopyCode(draftMain.copyCode());
                detail.setAcctYear(draftMain.acctYear());
                detail.setAcctMonth(draftMain.acctMonth());
                detail.setAcctSubjCode(detailDTO.acctSubjCode());
                detail.setAmtDebit(detailDTO.amtDebit() != null ? detailDTO.amtDebit() : java.math.BigDecimal.ZERO);
                detail.setAmtCredit(detailDTO.amtCredit() != null ? detailDTO.amtCredit() : java.math.BigDecimal.ZERO);
                vouchDetailDraftRepository.insert(detail);

                Long detailId = vouchDetailDraftRepository.getLastInsertId();

                if (detailDTO.checkItems() != null && !detailDTO.checkItems().isEmpty()) {
                    List<AcctCheckItemsDraft> items = buildDraftCheckItemEntities(
                        detailDTO.checkItems(), detailId, draftIdLong, draftMain, detailDTO.acctSubjCode());
                    checkItemsDraftRepository.batchInsert(items);
                }

                rowNum++;
            }
        }

        return new SaveVouchResult(draftIdLong, draftMain.vouchNo() != null ? draftMain.vouchNo() : 0, "草稿保存成功");
    }

    /**
     * 更新草稿 - 先删后插（全替换）
     */
    @Transactional(rollbackFor = Exception.class)
    public SaveVouchResult updateDraft(DraftSaveRequest request, String account) {
        DraftSaveRequest.DraftMain draftMain = request.draft();
        if (draftMain.draftId() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "草稿ID不能为空");
        }
        String operatorName = resolveOperatorName(account);
        Integer draftIdInt = draftMain.draftId().intValue();
        AcctVouchDraft draft = vouchDraftRepository.findById(draftIdInt)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "草稿不存在: " + draftMain.draftId()));

        draft.setVouchRemark(draftMain.draftName());
        draft.setVouchDate(draftMain.vouchDate());
        draft.setVouchBillNum(draftMain.vouchBillNum() != null ? draftMain.vouchBillNum() : 0);
        draft.setVouchTypeId(draftMain.vouchTypeId());
        draft.setOperator(operatorName);
        draft.setAccManager(draftMain.accManager());
        draft.setModifier(draftMain.modifier());
        draft.setTeller(draftMain.teller());
        vouchDraftRepository.update(draft);

        Long draftId = draftMain.draftId();
        checkItemsDraftRepository.deleteByVouchId(draftId);
        vouchDetailDraftRepository.deleteByVouchId(draftId);

        if (request.details() != null && !request.details().isEmpty()) {
            int pageNum = 1;
            int rowNum = 1;
            for (DraftSaveRequest.DraftDetail detailDTO : request.details()) {
                boolean isEmpty = (detailDTO.summary() == null || detailDTO.summary().isBlank())
                    && detailDTO.acctSubjCode() == null
                    && (detailDTO.amtDebit() == null || detailDTO.amtDebit().compareTo(java.math.BigDecimal.ZERO) == 0)
                    && (detailDTO.amtCredit() == null || detailDTO.amtCredit().compareTo(java.math.BigDecimal.ZERO) == 0);
                if (isEmpty) continue;
                // ... insert ...
                AcctVouchDetailDraft detail = new AcctVouchDetailDraft();
                detail.setVouchId(draftId);
                detail.setVouchPage(pageNum);
                detail.setVouchRow(rowNum);
                detail.setSummary(detailDTO.summary());
                detail.setCompCode(draftMain.compCode());
                detail.setCopyCode(draftMain.copyCode());
                detail.setAcctYear(draftMain.acctYear());
                detail.setAcctMonth(draftMain.acctMonth());
                detail.setAcctSubjCode(detailDTO.acctSubjCode());
                detail.setAmtDebit(detailDTO.amtDebit() != null ? detailDTO.amtDebit() : java.math.BigDecimal.ZERO);
                detail.setAmtCredit(detailDTO.amtCredit() != null ? detailDTO.amtCredit() : java.math.BigDecimal.ZERO);
                vouchDetailDraftRepository.insert(detail);

                Long detailId = vouchDetailDraftRepository.getLastInsertId();

                if (detailDTO.checkItems() != null && !detailDTO.checkItems().isEmpty()) {
                    List<AcctCheckItemsDraft> items = buildDraftCheckItemEntities(
                        detailDTO.checkItems(), detailId, draftId, draftMain, detailDTO.acctSubjCode());
                    checkItemsDraftRepository.batchInsert(items);
                }
                rowNum++;
            }
        }
        log.info("草稿更新成功: draftId={}, account={}", draftId, account);
        return new SaveVouchResult(draftId, draftMain.vouchNo() != null ? draftMain.vouchNo() : 0, "草稿更新成功");
    }

    public List<DraftListItem> getDraftList() {
        List<AcctVouchDraft> drafts = vouchDraftRepository.findAll();
        return drafts.stream()
                .map(d -> new DraftListItem(d.getVouchId().longValue(), d.getVouchRemark(), d.getCTime(), d.getOperator()))
                .toList();
    }

    public VouchLoadResponse loadDraft(Long draftId) {
        Integer draftIdInt = draftId.intValue();
        AcctVouchDraft draft = vouchDraftRepository.findById(draftIdInt)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "草稿不存在: " + draftId));

        VouchSaveRequest.VouchMain vouchMain = new VouchSaveRequest.VouchMain(
                draft.getVouchId().longValue(), draft.getCompCode(), draft.getCopyCode(),
                draft.getAcctYear(), draft.getAcctMonth(), draft.getVouchNo(),
                draft.getVouchDate(), draft.getVouchBillNum(), draft.getVouchTypeId(),
                draft.getVouchSourceCode(), draft.getAccManager(), draft.getOperator(),
                draft.getModifier(), draft.getTeller(), draft.getTypeAttr(), null,
                draft.getAuditor(), draft.getPoster());

        List<AcctVouchDetailDraft> details = vouchDetailDraftRepository.findByVouchId(draftId);
        List<VouchSaveRequest.VouchDetail> detailDTOs = details.stream()
                .map(this::toVouchDetailDraftDTO)
                .toList();

        OperatorInfo operatorInfo = resolveOperatorInfo(draft.getOperator());
        return new VouchLoadResponse("edit", vouchMain, detailDTOs, operatorInfo, false);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteDraft(Long draftId) {
        Integer draftIdInt = draftId.intValue();
        vouchDraftRepository.findById(draftIdInt)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "草稿不存在: " + draftId));
        checkItemsDraftRepository.deleteByVouchId(draftId);
        vouchDetailDraftRepository.deleteByVouchId(draftId);
        vouchDraftRepository.deleteById(draftIdInt);
        log.info("草稿删除成功: draftId={}", draftId);
    }

    private List<AcctCheckItemsDraft> buildDraftCheckItemEntities(
            List<DraftSaveRequest.DraftCheckItem> checkItemDTOs,
            Long detailId, Long vouchId,
            DraftSaveRequest.DraftMain draftMain,
            String acctSubjCode) {
        List<AcctCheckItemsDraft> items = new ArrayList<>();
        for (DraftSaveRequest.DraftCheckItem dto : checkItemDTOs) {
            AcctCheckItemsDraft row = new AcctCheckItemsDraft();
            row.setVouchDetailId(detailId);
            row.setVouchId(vouchId);
            row.setLine(dto.line() != null ? dto.line() : 1);
            row.setCompCode(draftMain.compCode());
            row.setCopyCode(draftMain.copyCode());
            row.setAcctYear(draftMain.acctYear());
            row.setAcctMonth(draftMain.acctMonth());
            row.setAcctSubjCode(acctSubjCode);
            row.setVouchNo(draftMain.vouchNo() != null ? draftMain.vouchNo() : 0);
            row.setVouchDate(draftMain.vouchDate());
            row.setIsInit("0");
            row.setSummary(dto.summary());
            row.setAmtDebit(dto.amtDebit() != null ? dto.amtDebit() : java.math.BigDecimal.ZERO);
            row.setAmtCredit(dto.amtCredit() != null ? dto.amtCredit() : java.math.BigDecimal.ZERO);
            if (dto.checkValues() != null) row.setCheckValuesFromMap(dto.checkValues());
            if (dto.otherFzhsIdx() != null) {
                String fzhsValue = getDraftInfoFzhsValue(dto, dto.otherFzhsIdx());
                if (fzhsValue != null && !fzhsValue.isBlank()) row.setInfoFzhs(dto.otherFzhsIdx(), fzhsValue);
            } else {
                if (dto.infoFzhs1() != null && !dto.infoFzhs1().isBlank()) row.setInfoFzhs1(dto.infoFzhs1());
                if (dto.infoFzhs2() != null && !dto.infoFzhs2().isBlank()) row.setInfoFzhs2(dto.infoFzhs2());
                if (dto.infoFzhs3() != null && !dto.infoFzhs3().isBlank()) row.setInfoFzhs3(dto.infoFzhs3());
                if (dto.infoFzhs4() != null && !dto.infoFzhs4().isBlank()) row.setInfoFzhs4(dto.infoFzhs4());
                if (dto.infoFzhs5() != null && !dto.infoFzhs5().isBlank()) row.setInfoFzhs5(dto.infoFzhs5());
            }
            applyDraftSpecialFieldMapping(dto, row, draftMain);
            items.add(row);
        }
        return items;
    }

    private void applyDraftSpecialFieldMapping(DraftSaveRequest.DraftCheckItem dto,
                                                 AcctCheckItemsDraft item,
                                                 DraftSaveRequest.DraftMain draftMain) {
        if (dto.orderDate() != null) {
            item.setOrderDate(dto.orderDate());
            item.setOccurDate(dto.occurDate() != null ? dto.occurDate() : dto.orderDate().toString());
        }
        if (dto.payTypeId() != null) item.setPayTypeId(dto.payTypeId());
        if (dto.cheqNo() != null && !dto.cheqNo().isBlank()) {
            item.setCheqNo(dto.cheqNo());
            item.setOrderNo(dto.orderNo() != null ? dto.orderNo() : dto.cheqNo());
        }
        if (dto.receiptNo() != null && !dto.receiptNo().isBlank()) item.setReceiptNo(dto.receiptNo());
        if (item.getOrderDate() != null && item.getOccurDate() == null) item.setOccurDate(item.getOrderDate().toString());
    }

    private String getDraftInfoFzhsValue(DraftSaveRequest.DraftCheckItem dto, int idx) {
        return switch (idx) {
            case 1 -> dto.infoFzhs1(); case 2 -> dto.infoFzhs2();
            case 3 -> dto.infoFzhs3(); case 4 -> dto.infoFzhs4();
            case 5 -> dto.infoFzhs5(); default -> null;
        };
    }

    private VouchSaveRequest.VouchDetail toVouchDetailDraftDTO(AcctVouchDetailDraft entity) {
        List<AcctCheckItemsDraft> checkItems = checkItemsDraftRepository.findByDetailId(entity.getVouchDetailId());
        List<VouchSaveRequest.CheckItem> checkItemDTOs = checkItems.stream()
                .map(item -> {
                    String checkItemType = "standard";
                    Integer otherFzhsIdx = null;
                    for (int i = 1; i <= 5; i++) {
                        if (item.getInfoFzhs(i) != null && !item.getInfoFzhs(i).isBlank()) {
                            otherFzhsIdx = i; break;
                        }
                    }
                    return new VouchSaveRequest.CheckItem(
                            item.getAcctCheckId(), item.getLine(), checkItemType,
                            item.getSummary(), item.getAmtDebit(), item.getAmtCredit(),
                            item.getCheckValuesAsMap(),
                            otherFzhsIdx,
                            item.getInfoFzhs1(), item.getInfoFzhs2(),
                            item.getInfoFzhs3(), item.getInfoFzhs4(), item.getInfoFzhs5(),
                            item.getOrderNo(), item.getOrderDate(),
                            item.getPayTypeId(), item.getCheqNo(),
                            item.getReceiptNo(), item.getOccurDate());
                })
                .toList();

        return new VouchSaveRequest.VouchDetail(
                entity.getVouchDetailId(), entity.getVouchPage(), entity.getVouchRow(),
                entity.getSummary(), entity.getAcctSubjCode(),
                entity.getAmtDebit(), entity.getAmtCredit(), checkItemDTOs);
    }

    @Transactional(rollbackFor = Exception.class)
    public void auditVouch(Long vouchId, String account) {
        AcctVouch vouch = vouchRepository.findById(vouchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "凭证不存在: " + vouchId));
        if (vouch.getPoster() != null && !vouch.getPoster().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已记账凭证不能审核");
        }
        if (vouch.getAuditor() != null && !vouch.getAuditor().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "凭证已审核，不能重复审核");
        }
        String auditorName = resolveOperatorName(account);
        vouchRepository.updateAudit(vouchId, auditorName, "1");
        log.info("凭证审核成功: vouchId={}, auditor={}", vouchId, auditorName);
    }

    @Transactional(rollbackFor = Exception.class)
    public void unauditVouch(Long vouchId, String account) {
        AcctVouch vouch = vouchRepository.findById(vouchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOUCH_NOT_FOUND, "凭证不存在: " + vouchId));
        if (vouch.getAuditor() == null || vouch.getAuditor().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "凭证未审核，不能销审");
        }
        vouchRepository.updateAudit(vouchId, null, "0");
        log.info("凭证销审成功: vouchId={}", vouchId);
    }
}