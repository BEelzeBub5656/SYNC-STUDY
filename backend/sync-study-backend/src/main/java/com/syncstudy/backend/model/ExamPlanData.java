package com.syncstudy.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExamPlanData(
        Long id,
        Long userId,
        String subject,
        LocalDate examDate,
        LocalDateTime createdAt
) {
}
