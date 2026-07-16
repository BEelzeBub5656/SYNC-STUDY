package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateTaskCompletionRequest(
        @NotNull(message = "完成状态不能为空")
        Boolean completed
) {
}
