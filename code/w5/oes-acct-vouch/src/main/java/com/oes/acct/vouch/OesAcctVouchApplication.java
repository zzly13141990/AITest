package com.oes.acct.vouch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OesAcctVouchApplication {

    public static void main(String[] args) {
        SpringApplication.run(OesAcctVouchApplication.class, args);
    }
}
