package com.syncstudy.backend.dto;

public record AgentMoodAdviceRequest(
        Long userId,
        String moodId,
        String description
) {
}
