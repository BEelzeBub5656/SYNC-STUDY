package com.syncstudy.backend.dto;

public class RegisterResponse {

    private Long userId;
    private String username;
    private String phone;

    public RegisterResponse(
            Long userId,
            String username,
            String phone
    ) {
        this.userId = userId;
        this.username = username;
        this.phone = phone;
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
}