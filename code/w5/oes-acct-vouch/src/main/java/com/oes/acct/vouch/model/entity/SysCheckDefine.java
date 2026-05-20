package com.oes.acct.vouch.model.entity;

public class SysCheckDefine {
    private Integer checkId;
    private String checkName;
    private String tableId;
    private String whereSql;
    private String isStop;
    private String checkMatchRule;
    private Integer isShowCode;
    private String isVouchDirect;
    private String directColumn;

    public Integer getCheckId() { return checkId; }
    public void setCheckId(Integer checkId) { this.checkId = checkId; }
    public String getCheckName() { return checkName; }
    public void setCheckName(String checkName) { this.checkName = checkName; }
    public String getTableId() { return tableId; }
    public void setTableId(String tableId) { this.tableId = tableId; }
    public String getWhereSql() { return whereSql; }
    public void setWhereSql(String whereSql) { this.whereSql = whereSql; }
    public String getIsStop() { return isStop; }
    public void setIsStop(String isStop) { this.isStop = isStop; }
    public String getCheckMatchRule() { return checkMatchRule; }
    public void setCheckMatchRule(String checkMatchRule) { this.checkMatchRule = checkMatchRule; }
    public Integer getIsShowCode() { return isShowCode; }
    public void setIsShowCode(Integer isShowCode) { this.isShowCode = isShowCode; }
    public String getIsVouchDirect() { return isVouchDirect; }
    public void setIsVouchDirect(String isVouchDirect) { this.isVouchDirect = isVouchDirect; }
    public String getDirectColumn() { return directColumn; }
    public void setDirectColumn(String directColumn) { this.directColumn = directColumn; }
}
