package com.projectalpha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GenerateSqlRequest {
    @NotBlank(message = "Question is required")
    private String question;

    @NotNull(message = "Connection ID is required")
    private Long connectionId;

    public GenerateSqlRequest() {
    }

    public GenerateSqlRequest(String question, Long connectionId) {
        this.question = question;
        this.connectionId = connectionId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }
}