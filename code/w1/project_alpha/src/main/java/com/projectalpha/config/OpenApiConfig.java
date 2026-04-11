package com.projectalpha.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Project Alpha API")
                        .description("基于标签的 Ticket 管理 REST API（见 specs/w1/0001-spec.md）")
                        .version("1.0.0"));
    }
}
