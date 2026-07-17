package com.syncstudy.backend.dto;

public record AgentMoodAdviceResponse(
        String moodId,
        String description,
        String advice
) {
}
