package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.LearningGoalResponse;
import com.syncstudy.backend.dto.LearningGoalsResponse;
import com.syncstudy.backend.dto.UpdateLearningGoalRequest;
import com.syncstudy.backend.enums.LearningGoalTerm;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.LearningGoalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning-goals")
public class LearningGoalController {

    private final LearningGoalService service;

    public LearningGoalController(LearningGoalService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<LearningGoalsResponse> get(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(service.get(user.id()));
    }

    @PutMapping("/{term}")
    public ApiResponse<LearningGoalResponse> update(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @PathVariable LearningGoalTerm term,
            @Valid @RequestBody UpdateLearningGoalRequest request
    ) {
        return ApiResponse.success(service.update(user.id(), term, request));
    }
}
