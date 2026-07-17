package com.syncstudy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiChatRequest(
        @NotBlank(message = "请输入要咨询的问题")
        @Size(max = 4000, message = "问题内容不能超过4000个字符")
        String message,

        @Size(max = 128, message = "会话编号不能超过128个字符")
        String threadId
) {
}
