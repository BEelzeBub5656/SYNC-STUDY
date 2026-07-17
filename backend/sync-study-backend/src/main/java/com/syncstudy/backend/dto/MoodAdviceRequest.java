package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MoodAdviceRequest(
        @NotBlank(message = "心情状态不能为空")
        @Size(max = 30, message = "心情状态不能超过 30 个字符")
        @Pattern(
                regexp = "happy|annoyed|calm|tired",
                message = "心情状态只能是 happy、annoyed、calm 或 tired"
        )
        String moodId,

        @Size(max = 1000, message = "心情描述不能超过 1000 个字符")
        String description
) {
}
