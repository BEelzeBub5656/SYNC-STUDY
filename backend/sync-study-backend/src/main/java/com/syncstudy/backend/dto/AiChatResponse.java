package com.syncstudy.backend.dto;

public record AiChatResponse(
        String status,
        String threadId,
        String message
) {
}
