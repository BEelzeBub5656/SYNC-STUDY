package com.syncstudy.backend.model;

public record AgentIdempotencyData(
        Long id,
        Long userId,
        String idempotencyKey,
        String operation,
        String requestFingerprint,
        String status,
        String responseJson
) {
    public boolean completed() {
        return "COMPLETED".equals(status);
    }
}
