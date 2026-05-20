package com.etyy.querytool;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QueryToolApplication {

    public static void main(String[] args) {
        SpringApplication.run(QueryToolApplication.class, args);
    }
}
