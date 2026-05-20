package com.oes.acct.vouch.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AcctVouch {
    private Long vouchId;
    private String compCode;
    private String copyCode;
    private String acctYear;
    private String acctMonth;
    private Integer vouchNo;
    private LocalDateTime vouchDate;
    private Integer vouchBillNum;
    private Integer vouchTypeId;
    private String vouchSourceCode;
    private String accManager;
    private String operator;
    private String auditor;
    private String poster;
    private String isCheck;
    private String isAcc;
    private String isCx;
    private String isCancel;
    private String isError;
    private String errorer;
    private Long cVouchId;
    private String acctMonth1;
    private String acctMonth2;
    private String teller;
    private String isTell;
    private String isChknot;
    private String modifier;
    private Integer templetId;
    private String recSubjCode;
    private String accSubjCode;
    private String outSubjCode;
    private Integer printNum;
    private Integer typeAttr;
    private Long relaVouchId;
    private String canDelete;
    private Integer vouchNoLast;
    private Integer isCzbksr;
    private String personVouchNo;
    private String extend1VouchNo;
    private String extend2VouchNo;

    // Getters and Setters
    public Long getVouchId() { return vouchId; }
    public void setVouchId(Long vouchId) { this.vouchId = vouchId; }
    public String getCompCode() { return compCode; }
    public void setCompCode(String compCode) { this.compCode = compCode; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String copyCode) { this.copyCode = copyCode; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String acctYear) { this.acctYear = acctYear; }
    public String getAcctMonth() { return acctMonth; }
    public void setAcctMonth(String acctMonth) { this.acctMonth = acctMonth; }
    public Integer getVouchNo() { return vouchNo; }
    public void setVouchNo(Integer vouchNo) { this.vouchNo = vouchNo; }
    public LocalDateTime getVouchDate() { return vouchDate; }
    public void setVouchDate(LocalDateTime vouchDate) { this.vouchDate = vouchDate; }
    public Integer getVouchBillNum() { return vouchBillNum; }
    public void setVouchBillNum(Integer vouchBillNum) { this.vouchBillNum = vouchBillNum; }
    public Integer getVouchTypeId() { return vouchTypeId; }
    public void setVouchTypeId(Integer vouchTypeId) { this.vouchTypeId = vouchTypeId; }
    public String getVouchSourceCode() { return vouchSourceCode; }
    public void setVouchSourceCode(String vouchSourceCode) { this.vouchSourceCode = vouchSourceCode; }
    public String getAccManager() { return accManager; }
    public void setAccManager(String accManager) { this.accManager = accManager; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    public String getAuditor() { return auditor; }
    public void setAuditor(String auditor) { this.auditor = auditor; }
    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }
    public String getIsCheck() { return isCheck; }
    public void setIsCheck(String isCheck) { this.isCheck = isCheck; }
    public String getIsAcc() { return isAcc; }
    public void setIsAcc(String isAcc) { this.isAcc = isAcc; }
    public String getIsCx() { return isCx; }
    public void setIsCx(String isCx) { this.isCx = isCx; }
    public String getIsCancel() { return isCancel; }
    public void setIsCancel(String isCancel) { this.isCancel = isCancel; }
    public String getIsError() { return isError; }
    public void setIsError(String isError) { this.isError = isError; }
    public String getErrorer() { return errorer; }
    public void setErrorer(String errorer) { this.errorer = errorer; }
    public Long getCVouchId() { return cVouchId; }
    public void setCVouchId(Long cVouchId) { this.cVouchId = cVouchId; }
    public String getAcctMonth1() { return acctMonth1; }
    public void setAcctMonth1(String acctMonth1) { this.acctMonth1 = acctMonth1; }
    public String getAcctMonth2() { return acctMonth2; }
    public void setAcctMonth2(String acctMonth2) { this.acctMonth2 = acctMonth2; }
    public String getTeller() { return teller; }
    public void setTeller(String teller) { this.teller = teller; }
    public String getIsTell() { return isTell; }
    public void setIsTell(String isTell) { this.isTell = isTell; }
    public String getIsChknot() { return isChknot; }
    public void setIsChknot(String isChknot) { this.isChknot = isChknot; }
    public String getModifier() { return modifier; }
    public void setModifier(String modifier) { this.modifier = modifier; }
    public Integer getTempletId() { return templetId; }
    public void setTempletId(Integer templetId) { this.templetId = templetId; }
    public String getRecSubjCode() { return recSubjCode; }
    public void setRecSubjCode(String recSubjCode) { this.recSubjCode = recSubjCode; }
    public String getAccSubjCode() { return accSubjCode; }
    public void setAccSubjCode(String accSubjCode) { this.accSubjCode = accSubjCode; }
    public String getOutSubjCode() { return outSubjCode; }
    public void setOutSubjCode(String outSubjCode) { this.outSubjCode = outSubjCode; }
    public Integer getPrintNum() { return printNum; }
    public void setPrintNum(Integer printNum) { this.printNum = printNum; }
    public Integer getTypeAttr() { return typeAttr; }
    public void setTypeAttr(Integer typeAttr) { this.typeAttr = typeAttr; }
    public Long getRelaVouchId() { return relaVouchId; }
    public void setRelaVouchId(Long relaVouchId) { this.relaVouchId = relaVouchId; }
    public String getCanDelete() { return canDelete; }
    public void setCanDelete(String canDelete) { this.canDelete = canDelete; }
    public Integer getVouchNoLast() { return vouchNoLast; }
    public void setVouchNoLast(Integer vouchNoLast) { this.vouchNoLast = vouchNoLast; }
    public Integer getIsCzbksr() { return isCzbksr; }
    public void setIsCzbksr(Integer isCzbksr) { this.isCzbksr = isCzbksr; }
    public String getPersonVouchNo() { return personVouchNo; }
    public void setPersonVouchNo(String personVouchNo) { this.personVouchNo = personVouchNo; }
    public String getExtend1VouchNo() { return extend1VouchNo; }
    public void setExtend1VouchNo(String extend1VouchNo) { this.extend1VouchNo = extend1VouchNo; }
    public String getExtend2VouchNo() { return extend2VouchNo; }
    public void setExtend2VouchNo(String extend2VouchNo) { this.extend2VouchNo = extend2VouchNo; }
}
