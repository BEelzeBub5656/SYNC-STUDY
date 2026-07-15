package com.syncstudy.backend.model;

public record UserAuthData(
        Long id,
        String username,
        String passwordHash
) {
}