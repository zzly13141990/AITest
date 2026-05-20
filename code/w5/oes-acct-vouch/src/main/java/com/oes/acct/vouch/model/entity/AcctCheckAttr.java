package com.oes.acct.vouch.model.entity;

public class AcctCheckAttr {
    private Integer attrId;
    private Integer mainTableId;
    private String mainFieldCode;
    private Integer attrTableId;
    private String attrFieldCode;
    private String checkFieldCode;
    private String attrShowName;
    private String isStop;
    private Integer targetOtherFzhsIdx;

    public Integer getAttrId() { return attrId; }
    public void setAttrId(Integer attrId) { this.attrId = attrId; }
    public Integer getMainTableId() { return mainTableId; }
    public void setMainTableId(Integer mainTableId) { this.mainTableId = mainTableId; }
    public String getMainFieldCode() { return mainFieldCode; }
    public void setMainFieldCode(String mainFieldCode) { this.mainFieldCode = mainFieldCode; }
    public Integer getAttrTableId() { return attrTableId; }
    public void setAttrTableId(Integer attrTableId) { this.attrTableId = attrTableId; }
    public String getAttrFieldCode() { return attrFieldCode; }
    public void setAttrFieldCode(String attrFieldCode) { this.attrFieldCode = attrFieldCode; }
    public String getCheckFieldCode() { return checkFieldCode; }
    public void setCheckFieldCode(String checkFieldCode) { this.checkFieldCode = checkFieldCode; }
    public String getAttrShowName() { return attrShowName; }
    public void setAttrShowName(String attrShowName) { this.attrShowName = attrShowName; }
    public String getIsStop() { return isStop; }
    public void setIsStop(String isStop) { this.isStop = isStop; }
    public Integer getTargetOtherFzhsIdx() { return targetOtherFzhsIdx; }
    public void setTargetOtherFzhsIdx(Integer targetOtherFzhsIdx) { this.targetOtherFzhsIdx = targetOtherFzhsIdx; }
}
