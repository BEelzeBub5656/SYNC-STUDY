package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.AiChatRequest;
import com.syncstudy.backend.dto.AiChatResponse;
import com.syncstudy.backend.dto.MoodAdviceRequest;
import com.syncstudy.backend.dto.MoodAdviceResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.AiChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody AiChatRequest request
    ) {
        return ApiResponse.success(aiChatService.chat(user.id(), request));
    }

    @PostMapping("/mood-advice")
    public ApiResponse<MoodAdviceResponse> moodAdvice(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody MoodAdviceRequest request
    ) {
        return ApiResponse.success(aiChatService.createMoodAdvice(user.id(), request));
    }
}
