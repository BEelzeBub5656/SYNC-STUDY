package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.config.JwtAuthInterceptor;
import com.syncstudy.backend.dto.DeletedResponse;
import com.syncstudy.backend.dto.KnowledgeDocumentRequest;
import com.syncstudy.backend.dto.KnowledgeDocumentResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.KnowledgeDocumentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/knowledge-documents")
public class KnowledgeDocumentController {

    private final KnowledgeDocumentService service;

    public KnowledgeDocumentController(KnowledgeDocumentService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<KnowledgeDocumentResponse>> search(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return ApiResponse.success(service.search(user.id(), q, limit));
    }

    @PostMapping
    public ApiResponse<KnowledgeDocumentResponse> create(
            @RequestAttribute(JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE)
            AuthenticatedUser user,
            @Valid @RequestBody KnowledgeDocumentRequest request
    ) {
        return ApiResponse.success(service.create(user.id(), request));
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
