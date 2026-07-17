package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.DeletedResponse;
import com.syncstudy.backend.dto.UserMemoryRequest;
import com.syncstudy.backend.dto.UserMemoryResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.UserMemoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/memories")
public class UserMemoryController {

    private final UserMemoryService service;

    public UserMemoryController(UserMemoryService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<UserMemoryResponse>> list(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(service.list(user.id()));
    }

    @PostMapping
    public ApiResponse<UserMemoryResponse> upsert(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody UserMemoryRequest request
    ) {
        return ApiResponse.success(service.upsert(user.id(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<DeletedResponse> delete(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @PathVariable @Positive Long id
    ) {
        service.delete(user.id(), id);
        return ApiResponse.success(new DeletedResponse(true));
    }
}
