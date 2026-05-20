package com.etyy.querytool.model.dto;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

public class QueryRequest {

    @NotBlank(message = "数据库IP不能为空")
    private String databaseIp;

    @Min(value = 1, message = "端口号最小为1")
    @Max(value = 65535, message = "端口号最大为65535")
    private int databasePort;

    @NotBlank(message = "数据库类型不能为空")
    @Pattern(regexp = "mysql|sqlserver|oracle", message = "不支持的数据库类型")
    private String databaseType;

    @NotBlank(message = "数据库用户名不能为空")
    private String databaseUsername;

    @NotBlank(message = "数据库密码不能为空")
    private String databasePassword;

    @NotBlank(message = "数据库名称不能为空")
    private String databaseName;

    @NotBlank(message = "SQL语句不能为空")
    private String sql;

    @Valid
    private PageParam page;

    public String getDatabaseIp() { return databaseIp; }
    public void setDatabaseIp(String databaseIp) { this.databaseIp = databaseIp; }
    public int getDatabasePort() { return databasePort; }
    public void setDatabasePort(int databasePort) { this.databasePort = databasePort; }
    public String getDatabaseType() { return databaseType; }
    public void setDatabaseType(String databaseType) { this.databaseType = databaseType; }
    public String getDatabaseUsername() { return databaseUsername; }
    public void setDatabaseUsername(String databaseUsername) { this.databaseUsername = databaseUsername; }
    public String getDatabasePassword() { return databasePassword; }
    public void setDatabasePassword(String databasePassword) { this.databasePassword = databasePassword; }
    public String getDatabaseName() { return databaseName; }
    public void setDatabaseName(String databaseName) { this.databaseName = databaseName; }
    public String getSql() { return sql; }
    public void setSql(String sql) { this.sql = sql; }
    public PageParam getPage() { return page; }
    public void setPage(PageParam page) { this.page = page; }
}
