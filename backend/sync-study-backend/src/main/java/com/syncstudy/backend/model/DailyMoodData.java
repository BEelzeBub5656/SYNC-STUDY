package com.syncstudy.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DailyMoodData(
        Long id,
        Long userId,
        LocalDate date,
        String moodId,
        String description,
        String advice,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
