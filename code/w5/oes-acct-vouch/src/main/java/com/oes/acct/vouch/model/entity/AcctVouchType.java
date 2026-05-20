package com.oes.acct.vouch.model.entity;

public class AcctVouchType {
    private Integer vouchTypeId;
    private String vouchTypeCode;
    private String vouchTypeName;
    private Integer typeAttr;

    public Integer getVouchTypeId() { return vouchTypeId; }
    public void setVouchTypeId(Integer vouchTypeId) { this.vouchTypeId = vouchTypeId; }
    public String getVouchTypeCode() { return vouchTypeCode; }
    public void setVouchTypeCode(String vouchTypeCode) { this.vouchTypeCode = vouchTypeCode; }
    public String getVouchTypeName() { return vouchTypeName; }
    public void setVouchTypeName(String vouchTypeName) { this.vouchTypeName = vouchTypeName; }
    public Integer getTypeAttr() { return typeAttr; }
    public void setTypeAttr(Integer typeAttr) { this.typeAttr = typeAttr; }
}
