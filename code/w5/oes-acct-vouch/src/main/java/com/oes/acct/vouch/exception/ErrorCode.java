package com.oes.acct.vouch.exception;

public enum ErrorCode {
    SUCCESS(0, "成功"),

    // Level 1: 基础数据校验错误 (1001~1007)
    IMBALANCE(1001, "借贷不平衡"),
    VOUCH_DATA_INVALID(1002, "凭证主表数据校验失败"),
    DETAIL_EMPTY(1003, "分录行为空"),
    CHECK_REQUIRED_MISSING(1004, "必填辅助核算未填写"),
    DB_EXCEPTION(1005, "数据库异常"),
    PARAM_INVALID(1006, "参数校验失败"),
    VOUCH_NOT_FOUND(1007, "凭证不存在"),

    // Level 2: 会计准则校验错误 (1008~1011)
    SUBJECT_NOT_LEAF(1008, "科目非末级"),
    AMOUNT_INVALID(1009, "金额非法（负数或超精度）"),
    DATE_OUT_OF_RANGE(1010, "凭证日期不在会计期间内"),
    DUPLICATE_COMBINATION(1011, "会计准则校验失败（分录组合重复）"),

    // Level 2: 辅助核算金额与分录金额一致性校验 (1012)
    CHECK_AMOUNT_MISMATCH(1012, "辅助核算金额与分录金额不一致"),

    // Level 3: 并发/系统错误 (1013)
    VOUCH_NO_CONFLICT(1013, "凭证号生成冲突，请重试"),

    // Level 3: 期间校验错误 (1014~1015)
    PERIOD_NOT_FOUND(1014, "未发现凭证日期对应的期间"),
    PERIOD_CLOSED(1015, "期间已结账"),

    // 系统错误
    SYSTEM_ERROR(9999, "系统内部错误");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
