package com.oes.acct.vouch.model.dto;

import java.time.LocalDateTime;

/**
 * 草稿列表项 DTO
 */
public record DraftListItem(
    Long draftId,
    String draftName,
    LocalDateTime draftCreateTime,
    String draftCreator
) {}
