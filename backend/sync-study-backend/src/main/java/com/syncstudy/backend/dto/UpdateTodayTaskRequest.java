package com.syncstudy.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateTodayTaskRequest(
        @Size(min = 1, max = 120, message = "任务名称长度应为 1 到 120 个字符")
        String title,

        @Min(value = 5, message = "预计时长不能少于 5 分钟")
        @Max(value = 240, message = "预计时长不能超过 240 分钟")
        Integer estimatedMinutes
) {
}
