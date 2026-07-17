package com.syncstudy.backend.model;

import java.time.LocalDateTime;

public record KnowledgeDocumentData(
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
