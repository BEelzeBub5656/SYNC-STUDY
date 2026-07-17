package com.syncstudy.backend.dto;

public record AgentChatRequest(
        Long userId,
        String message,
        String threadId
) {
}
