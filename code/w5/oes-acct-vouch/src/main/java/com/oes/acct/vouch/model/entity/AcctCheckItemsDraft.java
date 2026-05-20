package com.oes.acct.vouch.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 凭证草稿辅助核算明细表 - acct_check_items_draft
 * 结构与 acct_check_items 一致
 * acct_check_id 数据库自增（IDENTITY）
 */
public class AcctCheckItemsDraft {
    private Integer acctCheckId;
    private Long vouchDetailId;
    private Integer line;
    private String compCode;
    private String copyCode;
    private String acctYear;
    private String acctMonth;
    private String acctSubjCode;
    private String summary;
    private BigDecimal amtDebit;
    private BigDecimal amtCredit;
    private BigDecimal amtDebitF;
    private BigDecimal amtCreditF;
    private String exchRate;
    private String isInit;
    private Long vouchId;
    private Integer vouchNo;
    private LocalDateTime vouchDate;
    private Integer vouchRow;

    private Integer checktype1;  private Integer checktype2;  private Integer checktype3;
    private Integer checktype4;  private Integer checktype5;  private Integer checktype6;
    private Integer checktype7;  private Integer checktype8;  private Integer checktype9;
    private Integer checktype10; private Integer checktype11; private Integer checktype12;
    private Integer checktype13; private Integer checktype14; private Integer checktype15;
    private Integer checktype16; private Integer checktype17; private Integer checktype18;
    private Integer checktype19; private Integer checktype20; private Integer checktype21;
    private Integer checktype22; private Integer checktype23; private Integer checktype24;
    private Integer checktype25; private Integer checktype26; private Integer checktype27;
    private Integer checktype28; private Integer checktype29; private Integer checktype30;
    private Integer checktype31; private Integer checktype32; private Integer checktype33;
    private Integer checktype34; private Integer checktype35; private Integer checktype36;
    private Integer checktype37; private Integer checktype38; private Integer checktype39;
    private Integer checktype40; private Integer checktype41; private Integer checktype42;
    private Integer checktype43; private Integer checktype44; private Integer checktype45;
    private Integer checktype46; private Integer checktype47; private Integer checktype48;
    private Integer checktype49; private Integer checktype50;

    private String infoFzhs1; private String infoFzhs2; private String infoFzhs3;
    private String infoFzhs4; private String infoFzhs5;

    private String orderNo; private LocalDate orderDate; private Integer payTypeId;
    private String cheqNo; private String receiptNo; private String occurDate;
    private String operDate; private String createDate;

    public Integer getAcctCheckId() { return acctCheckId; }
    public void setAcctCheckId(Integer v) { this.acctCheckId = v; }
    public Long getVouchDetailId() { return vouchDetailId; }
    public void setVouchDetailId(Long v) { this.vouchDetailId = v; }
    public Integer getLine() { return line; }
    public void setLine(Integer v) { this.line = v; }
    public String getCompCode() { return compCode; }
    public void setCompCode(String v) { this.compCode = v; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String v) { this.copyCode = v; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String v) { this.acctYear = v; }
    public String getAcctMonth() { return acctMonth; }
    public void setAcctMonth(String v) { this.acctMonth = v; }
    public String getAcctSubjCode() { return acctSubjCode; }
    public void setAcctSubjCode(String v) { this.acctSubjCode = v; }
    public String getSummary() { return summary; }
    public void setSummary(String v) { this.summary = v; }
    public BigDecimal getAmtDebit() { return amtDebit; }
    public void setAmtDebit(BigDecimal v) { this.amtDebit = v; }
    public BigDecimal getAmtCredit() { return amtCredit; }
    public void setAmtCredit(BigDecimal v) { this.amtCredit = v; }
    public BigDecimal getAmtDebitF() { return amtDebitF; }
    public void setAmtDebitF(BigDecimal v) { this.amtDebitF = v; }
    public BigDecimal getAmtCreditF() { return amtCreditF; }
    public void setAmtCreditF(BigDecimal v) { this.amtCreditF = v; }
    public String getExchRate() { return exchRate; }
    public void setExchRate(String v) { this.exchRate = v; }
    public String getIsInit() { return isInit; }
    public void setIsInit(String v) { this.isInit = v; }
    public Long getVouchId() { return vouchId; }
    public void setVouchId(Long v) { this.vouchId = v; }
    public Integer getVouchNo() { return vouchNo; }
    public void setVouchNo(Integer v) { this.vouchNo = v; }
    public LocalDateTime getVouchDate() { return vouchDate; }
    public void setVouchDate(LocalDateTime v) { this.vouchDate = v; }
    public Integer getVouchRow() { return vouchRow; }
    public void setVouchRow(Integer v) { this.vouchRow = v; }

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String v) { this.orderNo = v; }
    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate v) { this.orderDate = v; }
    public Integer getPayTypeId() { return payTypeId; }
    public void setPayTypeId(Integer v) { this.payTypeId = v; }
    public String getCheqNo() { return cheqNo; }
    public void setCheqNo(String v) { this.cheqNo = v; }
    public String getReceiptNo() { return receiptNo; }
    public void setReceiptNo(String v) { this.receiptNo = v; }
    public String getOccurDate() { return occurDate; }
    public void setOccurDate(String v) { this.occurDate = v; }
    public String getOperDate() { return operDate; }
    public void setOperDate(String v) { this.operDate = v; }
    public String getCreateDate() { return createDate; }
    public void setCreateDate(String v) { this.createDate = v; }

    public String getInfoFzhs1() { return infoFzhs1; }
    public void setInfoFzhs1(String v) { this.infoFzhs1 = v; }
    public String getInfoFzhs2() { return infoFzhs2; }
    public void setInfoFzhs2(String v) { this.infoFzhs2 = v; }
    public String getInfoFzhs3() { return infoFzhs3; }
    public void setInfoFzhs3(String v) { this.infoFzhs3 = v; }
    public String getInfoFzhs4() { return infoFzhs4; }
    public void setInfoFzhs4(String v) { this.infoFzhs4 = v; }
    public String getInfoFzhs5() { return infoFzhs5; }
    public void setInfoFzhs5(String v) { this.infoFzhs5 = v; }

    public String getInfoFzhs(int idx) {
        return switch (idx) {
            case 1 -> infoFzhs1; case 2 -> infoFzhs2; case 3 -> infoFzhs3;
            case 4 -> infoFzhs4; case 5 -> infoFzhs5; default -> null;
        };
    }

    public void setInfoFzhs(int idx, String value) {
        switch (idx) {
            case 1 -> infoFzhs1 = value; case 2 -> infoFzhs2 = value;
            case 3 -> infoFzhs3 = value; case 4 -> infoFzhs4 = value;
            case 5 -> infoFzhs5 = value; default -> {}
        }
    }

    public Integer getChecktype(int checkId) {
        return switch (checkId) {
            case 1->checktype1; case 2->checktype2; case 3->checktype3;
            case 4->checktype4; case 5->checktype5; case 6->checktype6;
            case 7->checktype7; case 8->checktype8; case 9->checktype9;
            case 10->checktype10; case 11->checktype11; case 12->checktype12;
            case 13->checktype13; case 14->checktype14; case 15->checktype15;
            case 16->checktype16; case 17->checktype17; case 18->checktype18;
            case 19->checktype19; case 20->checktype20; case 21->checktype21;
            case 22->checktype22; case 23->checktype23; case 24->checktype24;
            case 25->checktype25; case 26->checktype26; case 27->checktype27;
            case 28->checktype28; case 29->checktype29; case 30->checktype30;
            case 31->checktype31; case 32->checktype32; case 33->checktype33;
            case 34->checktype34; case 35->checktype35; case 36->checktype36;
            case 37->checktype37; case 38->checktype38; case 39->checktype39;
            case 40->checktype40; case 41->checktype41; case 42->checktype42;
            case 43->checktype43; case 44->checktype44; case 45->checktype45;
            case 46->checktype46; case 47->checktype47; case 48->checktype48;
            case 49->checktype49; case 50->checktype50; default -> null;
        };
    }

    public void setChecktype(int checkId, Integer value) {
        switch (checkId) {
            case 1->checktype1=value; case 2->checktype2=value; case 3->checktype3=value;
            case 4->checktype4=value; case 5->checktype5=value; case 6->checktype6=value;
            case 7->checktype7=value; case 8->checktype8=value; case 9->checktype9=value;
            case 10->checktype10=value; case 11->checktype11=value; case 12->checktype12=value;
            case 13->checktype13=value; case 14->checktype14=value; case 15->checktype15=value;
            case 16->checktype16=value; case 17->checktype17=value; case 18->checktype18=value;
            case 19->checktype19=value; case 20->checktype20=value; case 21->checktype21=value;
            case 22->checktype22=value; case 23->checktype23=value; case 24->checktype24=value;
            case 25->checktype25=value; case 26->checktype26=value; case 27->checktype27=value;
            case 28->checktype28=value; case 29->checktype29=value; case 30->checktype30=value;
            case 31->checktype31=value; case 32->checktype32=value; case 33->checktype33=value;
            case 34->checktype34=value; case 35->checktype35=value; case 36->checktype36=value;
            case 37->checktype37=value; case 38->checktype38=value; case 39->checktype39=value;
            case 40->checktype40=value; case 41->checktype41=value; case 42->checktype42=value;
            case 43->checktype43=value; case 44->checktype44=value; case 45->checktype45=value;
            case 46->checktype46=value; case 47->checktype47=value; case 48->checktype48=value;
            case 49->checktype49=value; case 50->checktype50=value; default->{}
        }
    }

    public java.util.Map<Integer, Integer> getCheckValuesAsMap() {
        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
        for (int i = 1; i <= 50; i++) { Integer v = getChecktype(i); if (v != null) map.put(i, v); }
        return map;
    }

    public void setCheckValuesFromMap(java.util.Map<Integer, Integer> m) {
        if (m == null) return;
        for (java.util.Map.Entry<Integer, Integer> e : m.entrySet()) setChecktype(e.getKey(), e.getValue());
    }
}
