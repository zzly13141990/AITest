package com.oes.acct.vouch.model.entity;

public class AcctVouchNoSeq {
    private String compCode;
    private String copyCode;
    private String acctYear;
    private String acctMonth;
    private Integer nextNo;
    private Integer version;

    public String getCompCode() { return compCode; }
    public void setCompCode(String compCode) { this.compCode = compCode; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String copyCode) { this.copyCode = copyCode; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String acctYear) { this.acctYear = acctYear; }
    public String getAcctMonth() { return acctMonth; }
    public void setAcctMonth(String acctMonth) { this.acctMonth = acctMonth; }
    public Integer getNextNo() { return nextNo; }
    public void setNextNo(Integer nextNo) { this.nextNo = nextNo; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
