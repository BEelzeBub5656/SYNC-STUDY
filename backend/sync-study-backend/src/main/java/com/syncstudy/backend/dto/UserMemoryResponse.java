package com.syncstudy.backend.dto;

import java.time.LocalDateTime;

public record UserMemoryResponse(
        Long id,
        Long userId,
        String category,
        String memoryKey,
        String value,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
