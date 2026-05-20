package com.oes.acct.vouch.model.entity;

import java.time.LocalDate;

public class AcctSubjOtherFzSetting {
    private String settingId;
    private Integer otherFzhsIdx;
    private String inputType;
    private String dictType;
    private String dictName;
    private Integer acctSubjId;
    private String acctSubjCode;
    private String compCode;
    private String copyCode;
    private String acctYear;
    private LocalDate cTime;
    private Integer isShow;
    private Integer isRequire;

    public String getSettingId() { return settingId; }
    public void setSettingId(String settingId) { this.settingId = settingId; }
    public Integer getOtherFzhsIdx() { return otherFzhsIdx; }
    public void setOtherFzhsIdx(Integer otherFzhsIdx) { this.otherFzhsIdx = otherFzhsIdx; }
    public String getInputType() { return inputType; }
    public void setInputType(String inputType) { this.inputType = inputType; }
    public String getDictType() { return dictType; }
    public void setDictType(String dictType) { this.dictType = dictType; }
    public String getDictName() { return dictName; }
    public void setDictName(String dictName) { this.dictName = dictName; }
    public Integer getAcctSubjId() { return acctSubjId; }
    public void setAcctSubjId(Integer acctSubjId) { this.acctSubjId = acctSubjId; }
    public String getAcctSubjCode() { return acctSubjCode; }
    public void setAcctSubjCode(String acctSubjCode) { this.acctSubjCode = acctSubjCode; }
    public String getCompCode() { return compCode; }
    public void setCompCode(String compCode) { this.compCode = compCode; }
    public String getCopyCode() { return copyCode; }
    public void setCopyCode(String copyCode) { this.copyCode = copyCode; }
    public String getAcctYear() { return acctYear; }
    public void setAcctYear(String acctYear) { this.acctYear = acctYear; }
    public LocalDate getCTime() { return cTime; }
    public void setCTime(LocalDate cTime) { this.cTime = cTime; }
    public Integer getIsShow() { return isShow; }
    public void setIsShow(Integer isShow) { this.isShow = isShow; }
    public Integer getIsRequire() { return isRequire; }
    public void setIsRequire(Integer isRequire) { this.isRequire = isRequire; }
}
