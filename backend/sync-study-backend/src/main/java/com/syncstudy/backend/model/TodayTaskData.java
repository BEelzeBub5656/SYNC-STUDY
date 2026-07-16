package com.syncstudy.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TodayTaskData(
        Long id,
        Long userId,
        String title,
        int estimatedMinutes,
        String source,
        boolean completed,
        LocalDate taskDate,
        LocalDateTime completedAt,
        LocalDateTime createdAt
) {
}
