package com.syncstudy.backend.dto;

public class RegisterResponse {

    private Long userId;
    private String username;
    private String phone;
    private String token;
    private long expiresIn;

    public RegisterResponse(
            Long userId,
            String username,
            String phone,
            String token,
            long expiresIn
    ) {
        this.userId = userId;
        this.username = username;
        this.phone = phone;
        this.token = token;
        this.expiresIn = expiresIn;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getPhone() {
        return phone;
    }

    public String getToken() {
        return token;
    }

    public long getExpiresIn() {
        return expiresIn;
    }
}
