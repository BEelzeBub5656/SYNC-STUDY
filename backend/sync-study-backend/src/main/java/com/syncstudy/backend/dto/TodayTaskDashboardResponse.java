package com.syncstudy.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record TodayTaskDashboardResponse(
        LocalDate date,
        int totalCheckInDays,
        int todayStudyMinutes,
        int outperformPercent,
        List<RecommendedTaskResponse> recommendations,
        List<TodayTaskItemResponse> pendingTasks,
        List<TodayTaskItemResponse> completedTasks
) {
}
