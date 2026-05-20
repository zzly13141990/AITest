package com.oes.acct.vouch.model.entity;

import java.math.BigDecimal;

public class AcctVouchDetail {
    private Long vouchDetailId;
    private Long vouchId;
    private Integer vouchPage;
    private Integer vouchRow;
    private String summary;
    private String compCode;
    private String copyCode;
    private String acctYear;
    private String acctMonth;
    private String acctSubjCode;
    private BigDecimal amtDebit;
    private BigDecimal amtCredit;
    private Integer accDetailId;
    private String batchCode;
    private String otherSubjCode;

    public Long getVouchDetailId() { return vouchDetailId; }
    public void setVouchDetailId(Long vouchDetailId) { this.vouchDetailId = vouchDetailId; }
    public Long getVouchId() { return vouchId; }
    public void setVouchId(Long vouchId) { this.vouchId = vouchId; }
    public Integer getVouchPage() { return vouchPage; }
    public void setVouchPage(Integer vouchPage) { this.vouchPage = vouchPage; }
    public Integer getVouchRow() { return vouchRow; }
    public void setVouchRow(Integer vouchRow) { this.vouchRow = vouchRow; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getCompCode() { return compCode; }
    public void setCompCode(String compCode) { this.compCode = compCode; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String copyCode) { this.copyCode = copyCode; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String acctYear) { this.acctYear = acctYear; }
    public String getAcctMonth() { return acctMonth; }
    public void setAcctMonth(String acctMonth) { this.acctMonth = acctMonth; }
    public String getAcctSubjCode() { return acctSubjCode; }
    public void setAcctSubjCode(String acctSubjCode) { this.acctSubjCode = acctSubjCode; }
    public BigDecimal getAmtDebit() { return amtDebit; }
    public void setAmtDebit(BigDecimal amtDebit) { this.amtDebit = amtDebit; }
    public BigDecimal getAmtCredit() { return amtCredit; }
    public void setAmtCredit(BigDecimal amtCredit) { this.amtCredit = amtCredit; }
    public Integer getAccDetailId() { return accDetailId; }
    public void setAccDetailId(Integer accDetailId) { this.accDetailId = accDetailId; }
    public String getBatchCode() { return batchCode; }
    public void setBatchCode(String batchCode) { this.batchCode = batchCode; }
    public String getOtherSubjCode() { return otherSubjCode; }
    public void setOtherSubjCode(String otherSubjCode) { this.otherSubjCode = otherSubjCode; }
}
