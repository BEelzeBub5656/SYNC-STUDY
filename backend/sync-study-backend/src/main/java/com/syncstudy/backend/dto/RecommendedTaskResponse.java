package com.syncstudy.backend.dto;

public record RecommendedTaskResponse(
        String id,
        String title,
        int estimatedMinutes
) {
}
