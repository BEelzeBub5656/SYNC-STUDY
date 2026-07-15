package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.dto.IdentityRequest;
import com.syncstudy.backend.dto.IdentityResponse;
import com.syncstudy.backend.enums.IdentityType;
import com.syncstudy.backend.service.IdentityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    private final IdentityService identityService;

    public IdentityController(
            IdentityService identityService
    ) {
        this.identityService = identityService;
    }

    @PostMapping
    public ApiResponse<IdentityResponse> selectIdentity(
            @Valid @RequestBody IdentityRequest request
    ) {
        IdentityType savedIdentity =
                identityService.saveIdentity(
                        request.getIdentity()
                );

        IdentityResponse response =
                new IdentityResponse(savedIdentity);

        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<IdentityResponse> getIdentity() {
        IdentityType identity =
                identityService.getIdentity();

        IdentityResponse response =
                new IdentityResponse(identity);

        return ApiResponse.success(response);
    }
}