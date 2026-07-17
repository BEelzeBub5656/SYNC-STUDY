package com.syncstudy.backend.dto;

import com.syncstudy.backend.enums.LearningGoalTerm;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record LearningGoalResponse(
        Long id,
        LearningGoalTerm term,
        String title,
        String detail,
        LocalDate targetDate,
        int progressPercent,
        List<String> actions,
        LocalDateTime updatedAt
) {
}
