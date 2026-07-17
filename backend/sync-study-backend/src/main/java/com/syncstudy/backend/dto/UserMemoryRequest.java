package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserMemoryRequest(
        @NotBlank(message = "记忆分类不能为空")
        @Size(max = 40, message = "记忆分类不能超过 40 个字符")
        @Pattern(
                regexp = "PROFILE|INTEREST|LEARNING_PREFERENCE|BACKGROUND",
                message = "记忆分类不受支持"
        )
        String category,

        @NotBlank(message = "记忆键不能为空")
        @Size(max = 80, message = "记忆键不能超过 80 个字符")
        String memoryKey,

        @NotBlank(message = "记忆内容不能为空")
        @Size(max = 1000, message = "记忆内容不能超过 1000 个字符")
        String value
) {
}
