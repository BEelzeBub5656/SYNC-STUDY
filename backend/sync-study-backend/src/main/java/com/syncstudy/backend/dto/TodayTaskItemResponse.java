package com.syncstudy.backend.dto;

import java.time.LocalDateTime;

public record TodayTaskItemResponse(
        Long id,
        String title,
        int estimatedMinutes,
        String source,
        boolean completed,
        LocalDateTime completedAt
) {
}
