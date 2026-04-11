package com.projectalpha.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "TicketUpdateRequest")
public record TicketUpdateRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 8000) String description,
        @NotNull Boolean completed) {}
