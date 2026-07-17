package com.syncstudy.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record InternalTaskUpdateRequest(
        @Size(min = 1, max = 120, message = "任务名称长度应为 1 到 120 个字符")
        String title,

        @Min(value = 1, message = "预计时长不能少于 1 分钟")
        @Max(value = 1440, message = "预计时长不能超过 1440 分钟")
        Integer estimatedMinutes,

        Boolean completed
) {
}
