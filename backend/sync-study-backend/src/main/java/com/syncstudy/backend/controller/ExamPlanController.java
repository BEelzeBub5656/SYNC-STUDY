package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.CreateExamPlanRequest;
import com.syncstudy.backend.dto.ExamPlanResponse;
import com.syncstudy.backend.service.ExamPlanService;
import com.syncstudy.backend.model.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/exam-plans")
public class ExamPlanController {

    private final ExamPlanService examPlanService;

    public ExamPlanController(ExamPlanService examPlanService) {
        this.examPlanService = examPlanService;
    }

    @PostMapping
    public ApiResponse<ExamPlanResponse> create(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody CreateExamPlanRequest request
    ) {
        return ApiResponse.success(examPlanService.create(user.id(), request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExamPlanResponse> getById(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @PathVariable @Positive Long id
    ) {
        return ApiResponse.success(examPlanService.getById(user.id(), id));
    }

    @GetMapping("/latest")
    public ApiResponse<ExamPlanResponse> getLatest(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(examPlanService.getLatest(user.id()));
    }
}
