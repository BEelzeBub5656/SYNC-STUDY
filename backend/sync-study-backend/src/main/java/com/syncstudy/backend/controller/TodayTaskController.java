package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.CreateTodayTaskRequest;
import com.syncstudy.backend.dto.TodayTaskDashboardResponse;
import com.syncstudy.backend.dto.UpdateTaskCompletionRequest;
import com.syncstudy.backend.service.TodayTaskService;
import com.syncstudy.backend.model.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/today-tasks")
public class TodayTaskController {

    private final TodayTaskService todayTaskService;

    public TodayTaskController(TodayTaskService todayTaskService) {
        this.todayTaskService = todayTaskService;
    }

    @GetMapping
    public ApiResponse<TodayTaskDashboardResponse> getDashboard(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(todayTaskService.getDashboard(user.id()));
    }

    @PostMapping
    public ApiResponse<TodayTaskDashboardResponse> create(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody CreateTodayTaskRequest request
    ) {
        return ApiResponse.success(todayTaskService.create(user.id(), request));
    }

    @PatchMapping("/{id}/completion")
    public ApiResponse<TodayTaskDashboardResponse> updateCompletion(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @PathVariable @Positive Long id,
            @Valid @RequestBody UpdateTaskCompletionRequest request
    ) {
        return ApiResponse.success(todayTaskService.updateCompletion(id, user.id(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<TodayTaskDashboardResponse> delete(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @PathVariable @Positive Long id
    ) {
        return ApiResponse.success(todayTaskService.delete(id, user.id()));
    }
}
