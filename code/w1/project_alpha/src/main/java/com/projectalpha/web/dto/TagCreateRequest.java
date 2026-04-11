package com.projectalpha.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "TagCreateRequest")
public record TagCreateRequest(@NotBlank @Size(max = 64) @Schema(example = "backend") String name) {}
