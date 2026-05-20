package com.oes.acct.vouch.aspect;

import com.oes.acct.vouch.annotation.OperationLog;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

/**
 * AOP aspect that logs all controller operations marked with @OperationLog.
 * Writes structured audit records to the OPERATION_LOGGER for audit trail,
 * and detailed request/response info to the application log.
 */
@Aspect
@Component
public class OperationLogAspect {

    private static final Logger log = LoggerFactory.getLogger(OperationLogAspect.class);
    private static final Logger operationLogger = LoggerFactory.getLogger("OPERATION_LOGGER");

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Around("@annotation(operationLog)")
    public Object logOperation(ProceedingJoinPoint joinPoint, OperationLog operationLog) throws Throwable {
        String operation = operationLog.operation();
        String module = operationLog.module();

        // Extract request info
        HttpServletRequest request = getCurrentRequest();
        String operator = extractOperator(request);
        String ip = (request != null) ? request.getRemoteAddr() : "unknown";
        String method = joinPoint.getSignature().toShortString();
        String args = Arrays.toString(joinPoint.getArgs());

        long startTime = System.currentTimeMillis();
        String resultStatus = "成功";
        String errorMsg = "";

        log.info("===== 操作开始: [{}] {} - 操作人: {} =====", module, operation, operator);
        log.debug("请求方法: {}, 参数: {}", method, args);

        try {
            Object result = joinPoint.proceed();
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("===== 操作完成: [{}] {} - 耗时: {}ms =====", module, operation, elapsed);

            // Write operation audit log
            operationLogger.info("{} | {} | {} | {} | {} | IP: {} | 耗时: {}ms",
                    LocalDateTime.now().format(DTF), operator, module, operation, resultStatus, ip, elapsed);

            return result;
        } catch (Throwable e) {
            long elapsed = System.currentTimeMillis() - startTime;
            resultStatus = "失败";
            errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();

            log.error("===== 操作失败: [{}] {} - 原因: {} =====", module, operation, errorMsg, e);

            // Write operation audit log (failure)
            operationLogger.info("{} | {} | {} | {} | {} | 错误: {} | IP: {} | 耗时: {}ms",
                    LocalDateTime.now().format(DTF), operator, module, operation, resultStatus, errorMsg, ip, elapsed);

            throw e;
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return (attrs != null) ? attrs.getRequest() : null;
    }

    private String extractOperator(HttpServletRequest request) {
        if (request == null) return "unknown";
        String operator = request.getParameter("account");
        if (operator == null || operator.isBlank()) {
            operator = request.getParameter("operator");
        }
        return (operator != null && !operator.isBlank()) ? operator : "unknown";
    }
}
