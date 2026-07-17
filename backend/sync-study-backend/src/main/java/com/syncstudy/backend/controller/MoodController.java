package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.MoodAdviceResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.AiChatService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/moods")
public class MoodController {

    private final AiChatService aiChatService;

    public MoodController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @GetMapping("/today")
    public ApiResponse<MoodAdviceResponse> today(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(aiChatService.getTodayMood(user.id()));
    }
}
