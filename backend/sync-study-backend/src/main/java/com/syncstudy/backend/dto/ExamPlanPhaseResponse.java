package com.syncstudy.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record ExamPlanPhaseResponse(
        String title,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        List<String> tasks
) {
}
