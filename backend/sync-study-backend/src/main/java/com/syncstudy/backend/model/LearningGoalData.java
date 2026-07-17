package com.syncstudy.backend.model;

import com.syncstudy.backend.enums.LearningGoalTerm;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LearningGoalData(
        Long id,
        Long userId,
        LearningGoalTerm term,
        String title,
        String detail,
        LocalDate targetDate,
        int progressPercent,
        String actionsJson,
        LocalDateTime updatedAt
) {
}
