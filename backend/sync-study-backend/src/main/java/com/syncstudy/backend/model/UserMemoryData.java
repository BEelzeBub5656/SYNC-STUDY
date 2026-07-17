package com.syncstudy.backend.model;

import java.time.LocalDateTime;

public record UserMemoryData(
        Long id,
        Long userId,
        String category,
        String memoryKey,
        String value,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
