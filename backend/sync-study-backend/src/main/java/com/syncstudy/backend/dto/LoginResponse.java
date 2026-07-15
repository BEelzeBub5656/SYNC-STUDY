package com.syncstudy.backend.dto;

public class LoginResponse {

    private Long userId;
    private String username;
    private String token;
    private long expiresIn;

    public LoginResponse(
            Long userId,
            String username,
            String token,
            long expiresIn
    ) {
        this.userId = userId;
        this.username = username;
        this.token = token;
        this.expiresIn = expiresIn;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getToken() {
        return token;
    }

    public long getExpiresIn() {
        return expiresIn;
    }
}