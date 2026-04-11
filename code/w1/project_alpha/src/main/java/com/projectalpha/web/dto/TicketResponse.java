package com.projectalpha.web.dto;

import com.projectalpha.domain.Ticket;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

@Schema(name = "Ticket")
public record TicketResponse(
        Long id,
        String title,
        String description,
        boolean completed,
        Instant createdAt,
        Instant updatedAt,
        List<TagResponse> tags) {

    public static TicketResponse from(Ticket t) {
        var tagList = t.getTags().stream().map(TagResponse::from).sorted((a, b) -> a.name().compareToIgnoreCase(b.name())).toList();
        return new TicketResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.isCompleted(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                tagList);
    }
}
