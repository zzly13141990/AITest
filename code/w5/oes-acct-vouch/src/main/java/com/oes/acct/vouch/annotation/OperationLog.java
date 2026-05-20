package com.oes.acct.vouch.annotation;

import java.lang.annotation.*;

/**
 * Mark a controller method for operation logging.
 * Operations are logged to both the application log and the operation audit log.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /** Operation name, e.g. "录入凭证", "保存凭证", "查询凭证" */
    String operation();

    /** Module name, e.g. "凭证管理" */
    String module() default "凭证管理";
}
