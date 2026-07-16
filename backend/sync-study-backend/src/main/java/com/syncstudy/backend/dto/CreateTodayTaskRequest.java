package com.syncstudy.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTodayTaskRequest(
        @NotBlank(message = "任务名称不能为空")
        @Size(max = 120, message = "任务名称不能超过 120 个字符")
        String title,

        @NotNull(message = "预计时长不能为空")
        @Min(value = 5, message = "预计时长不能少于 5 分钟")
        @Max(value = 240, message = "预计时长不能超过 240 分钟")
        Integer estimatedMinutes,

        @NotBlank(message = "任务来源不能为空")
        @Pattern(regexp = "AI|CUSTOM", message = "任务来源只能是 AI 或 CUSTOM")
        String source
) {
}
