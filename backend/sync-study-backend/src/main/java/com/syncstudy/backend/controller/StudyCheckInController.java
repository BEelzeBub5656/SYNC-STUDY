package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.StudyCheckInResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.StudyCheckInService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/study-check-ins")
public class StudyCheckInController {

    private final StudyCheckInService studyCheckInService;

    public StudyCheckInController(StudyCheckInService studyCheckInService) {
        this.studyCheckInService = studyCheckInService;
    }

    @PostMapping
    public ApiResponse<StudyCheckInResponse> checkIn(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(studyCheckInService.checkIn(user.id()));
    }

    @GetMapping("/summary")
    public ApiResponse<StudyCheckInResponse> getSummary(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @RequestParam @NotBlank String month
    ) {
        return ApiResponse.success(studyCheckInService.getSummary(user.id(), month));
    }
}
