package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PersonaProfileRequest(
        @NotEmpty(message = "人物画像选择不能为空")
        List<List<String>> answers
) {
}
