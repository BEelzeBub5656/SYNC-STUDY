package com.syncstudy.backend.dto;

public record AgentChatResponse(
        String status,
        String threadId,
        String message
) {
}
