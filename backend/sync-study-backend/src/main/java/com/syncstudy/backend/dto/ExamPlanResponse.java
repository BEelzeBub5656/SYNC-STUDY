package com.syncstudy.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ExamPlanResponse(
        Long id,
        Long userId,
        String subject,
        LocalDate examDate,
        long remainingDays,
        int progressPercent,
        LocalDateTime createdAt,
        List<ExamPlanPhaseResponse> phases
) {
}
