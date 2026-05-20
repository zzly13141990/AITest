package com.oes.acct.vouch.config;

import org.springframework.context.annotation.AdviceMode;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement(mode = AdviceMode.PROXY)
public class TransactionConfig {
    // Uses Spring's declarative transaction management via @Transactional
}
