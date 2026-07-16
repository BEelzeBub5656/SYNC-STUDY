package com.syncstudy.backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateExamPlanRequest(
        @NotBlank(message = "考试科目不能为空")
        @Size(max = 100, message = "考试科目不能超过 100 个字符")
        String subject,

        @NotNull(message = "考试日期不能为空")
        @FutureOrPresent(message = "考试日期不能早于今天")
        LocalDate examDate
) {
}
