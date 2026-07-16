package com.syncstudy.backend.dto;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

public record StudyCheckInResponse(
        Long userId,
        LocalDate checkInDate,
        boolean newlyCheckedIn,
        int pointsEarned,
        int continuousDays,
        int totalDays,
        YearMonth month,
        List<LocalDate> checkedDates
) {
}
