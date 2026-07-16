package com.syncstudy.backend.dto;

public record CurrentUserResponse(
        Long userId,
        String username
) {
}
