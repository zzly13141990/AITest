package com.oes.acct.vouch.model.entity;

import java.time.LocalDate;

public class AcctYearPeriod {
    private Integer acctYearPeriodId;
    private String compCode;
    private String copyCode;
    private String acctYear;
    private String acctMonth;
    private LocalDate beginDate;
    private LocalDate endDate;
    private Integer accFlag;

    public Integer getAcctYearPeriodId() { return acctYearPeriodId; }
    public void setAcctYearPeriodId(Integer v) { this.acctYearPeriodId = v; }
    public String getCompCode() { return compCode; }
    public void setCompCode(String v) { this.compCode = v; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String v) { this.copyCode = v; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String v) { this.acctYear = v; }
    public String getAcctMonth() { return acctMonth; }
    public void setAcctMonth(String v) { this.acctMonth = v; }
    public LocalDate getBeginDate() { return beginDate; }
    public void setBeginDate(LocalDate v) { this.beginDate = v; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate v) { this.endDate = v; }
    public Integer getAccFlag() { return accFlag; }
    public void setAccFlag(Integer v) { this.accFlag = v; }
}
