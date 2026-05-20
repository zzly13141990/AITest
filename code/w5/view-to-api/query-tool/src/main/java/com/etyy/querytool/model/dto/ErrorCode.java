package com.etyy.querytool.model.dto;

public enum ErrorCode {
    SUCCESS(200, "success", "操作成功"),
    PARAM_MISSING(400, "fail", "请求参数缺失"),
    JSON_PARSE_ERROR(400, "fail", "请求体不是合法的 JSON 格式"),
    UNSUPPORTED_DB_TYPE(400, "fail", "不支持的数据库类型"),
    NOT_SELECT_STATEMENT(400, "fail", "仅允许 SELECT 查询语句"),
    MISSING_ORDER_BY(400, "fail", "使用分页查询时 SQL 必须包含 ORDER BY 子句"),
    SQL_PARSE_ERROR(400, "fail", "SQL 语句无法解析"),
    DANGEROUS_SQL(400, "fail", "SQL 包含被禁止的操作"),
    CONNECTION_FAILED(502, "fail", "数据库连接失败"),
    QUERY_TIMEOUT(504, "fail", "查询执行超时"),
    RESULT_TOO_LARGE(422, "fail", "查询结果超过上限，请缩小查询范围"),
    LOG_NOT_FOUND(404, "fail", "日志记录不存在"),
    INVALID_PARAM(400, "fail", "参数格式错误"),
    POOL_FULL(502, "fail", "目标数据库连接池已满");

    private final int httpStatus;
    private final String status;
    private final String message;

    ErrorCode(int httpStatus, String status, String message) {
        this.httpStatus = httpStatus;
        this.status = status;
        this.message = message;
    }

    public int getHttpStatus() { return httpStatus; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
}
