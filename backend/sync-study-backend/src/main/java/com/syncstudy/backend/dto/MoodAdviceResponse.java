package com.syncstudy.backend.dto;

import java.time.LocalDate;

public record MoodAdviceResponse(
        String moodId,
        String description,
        String advice,
        LocalDate date
) {
}
