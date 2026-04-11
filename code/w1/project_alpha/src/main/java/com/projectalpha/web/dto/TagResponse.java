package com.projectalpha.web.dto;

import com.projectalpha.domain.Tag;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Tag")
public record TagResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "bug") String name) {

    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName());
    }
}
