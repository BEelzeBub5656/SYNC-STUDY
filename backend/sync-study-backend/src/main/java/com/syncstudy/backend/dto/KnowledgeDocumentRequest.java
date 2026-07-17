package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record KnowledgeDocumentRequest(
        @NotBlank(message = "资料标题不能为空")
        @Size(max = 160, message = "资料标题不能超过 160 个字符")
        String title,

        @NotBlank(message = "课程名称不能为空")
        @Size(max = 100, message = "课程名称不能超过 100 个字符")
        String course,

        @NotBlank(message = "资料来源类型不能为空")
        @Size(max = 30, message = "资料来源类型不能超过 30 个字符")
        @Pattern(regexp = "[A-Za-z0-9_-]+", message = "资料来源类型只能包含字母、数字、下划线或连字符")
        String sourceType,

        @NotBlank(message = "资料内容不能为空")
        @Size(max = 50000, message = "资料内容不能超过 50000 个字符")
        String content
) {
}
