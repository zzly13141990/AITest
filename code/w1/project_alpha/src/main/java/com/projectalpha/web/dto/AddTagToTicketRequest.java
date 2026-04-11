package com.projectalpha.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "AddTagToTicketRequest", description = "提供 tagId 或 tagName 之一")
public record AddTagToTicketRequest(
        @Schema(example = "2") Long tagId,
        @Schema(example = "frontend") String tagName) {}
