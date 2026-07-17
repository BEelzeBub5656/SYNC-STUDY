package com.syncstudy.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record UpdateLearningGoalRequest(
        @NotBlank(message = "目标名称不能为空")
        @Size(max = 60, message = "目标名称不能超过60个字符")
        String title,

        @NotBlank(message = "目标详情不能为空")
        @Size(max = 255, message = "目标详情不能超过255个字符")
        String detail,

        LocalDate targetDate,

        @Min(value = 0, message = "目标进度不能小于0")
        @Max(value = 100, message = "目标进度不能大于100")
        Integer progressPercent,

        @Size(max = 20, message = "行动清单不能超过20项")
        List<
                @Valid
                @NotBlank(message = "行动内容不能为空")
                @Size(max = 120, message = "单条行动不能超过120个字符")
                String
                > actions
) {
}
