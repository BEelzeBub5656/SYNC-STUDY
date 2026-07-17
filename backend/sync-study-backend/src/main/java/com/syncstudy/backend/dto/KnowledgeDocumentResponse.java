package com.syncstudy.backend.dto;

import java.time.LocalDateTime;

public record KnowledgeDocumentResponse(
        Long id,
        Long userId,
        String title,
        String course,
        String sourceType,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
