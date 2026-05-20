package com.oes.acct.vouch.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CheckOption(
    Integer id,
    String code,
    String name
) {}
