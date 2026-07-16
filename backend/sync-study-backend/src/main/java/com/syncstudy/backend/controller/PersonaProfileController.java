package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.PersonaProfileRequest;
import com.syncstudy.backend.dto.PersonaProfileResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.PersonaProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/persona")
public class PersonaProfileController {

    private final PersonaProfileService service;

    public PersonaProfileController(PersonaProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<PersonaProfileResponse> get(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user
    ) {
        return ApiResponse.success(service.get(user.id()));
    }

    @PutMapping
    public ApiResponse<PersonaProfileResponse> save(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody PersonaProfileRequest request
    ) {
        return ApiResponse.success(service.save(user.id(), request));
    }
}
