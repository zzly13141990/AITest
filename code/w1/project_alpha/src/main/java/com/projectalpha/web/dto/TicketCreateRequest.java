package com.projectalpha.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "TicketCreateRequest")
public record TicketCreateRequest(
        @NotBlank @Size(max = 255) @Schema(example = "整理文档") String title,
        @Size(max = 8000) @Schema(example = "补充说明") String description) {}
