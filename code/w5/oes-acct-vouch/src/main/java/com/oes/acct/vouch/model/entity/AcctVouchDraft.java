package com.oes.acct.vouch.model.entity;

import java.time.LocalDateTime;

/**
 * 凭证草稿主表 - acct_vouch_draft
 * 主键 vouch_id 自增
 * vouch_remark 存草稿名称
 * c_time 存创建时间
 * group_name 固定为"默认分组"
 * is_templet 默认 0
 */
public class AcctVouchDraft {
    private Integer vouchId;
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
    private Integer cVouchId;
    private String acctMonth1;
    private String acctMonth2;
    private String teller;
    private String isTell;
    private String isChknot;
    private String modifier;
    private Integer templetId;
    private Integer printNum;
    private Integer isAuto;
    private Integer typeAttr;
    private Integer relaVouchId;
    private LocalDateTime cTime;
    private String vouchRemark;
    private String isTemplet;
    private String groupName;
    private String extend1VouchNo;
    private String extend2VouchNo;

    public Integer getVouchId() { return vouchId; }
    public void setVouchId(Integer vouchId) { this.vouchId = vouchId; }
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
    public Integer getCVouchId() { return cVouchId; }
    public void setCVouchId(Integer cVouchId) { this.cVouchId = cVouchId; }
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
    public Integer getPrintNum() { return printNum; }
    public void setPrintNum(Integer printNum) { this.printNum = printNum; }
    public Integer getIsAuto() { return isAuto; }
    public void setIsAuto(Integer isAuto) { this.isAuto = isAuto; }
    public Integer getTypeAttr() { return typeAttr; }
    public void setTypeAttr(Integer typeAttr) { this.typeAttr = typeAttr; }
    public Integer getRelaVouchId() { return relaVouchId; }
    public void setRelaVouchId(Integer relaVouchId) { this.relaVouchId = relaVouchId; }
    public LocalDateTime getCTime() { return cTime; }
    public void setCTime(LocalDateTime cTime) { this.cTime = cTime; }
    public String getVouchRemark() { return vouchRemark; }
    public void setVouchRemark(String vouchRemark) { this.vouchRemark = vouchRemark; }
    public String getIsTemplet() { return isTemplet; }
    public void setIsTemplet(String isTemplet) { this.isTemplet = isTemplet; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getExtend1VouchNo() { return extend1VouchNo; }
    public void setExtend1VouchNo(String extend1VouchNo) { this.extend1VouchNo = extend1VouchNo; }
    public String getExtend2VouchNo() { return extend2VouchNo; }
    public void setExtend2VouchNo(String extend2VouchNo) { this.extend2VouchNo = extend2VouchNo; }
}
