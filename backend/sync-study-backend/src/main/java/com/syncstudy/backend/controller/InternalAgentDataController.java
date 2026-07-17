package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.dto.DeletedResponse;
import com.syncstudy.backend.dto.ExamPlanResponse;
import com.syncstudy.backend.dto.InternalCreateTaskRequest;
import com.syncstudy.backend.dto.InternalTaskUpdateRequest;
import com.syncstudy.backend.dto.KnowledgeDocumentResponse;
import com.syncstudy.backend.dto.TodayTaskItemResponse;
import com.syncstudy.backend.dto.UserMemoryRequest;
import com.syncstudy.backend.dto.UserMemoryResponse;
import com.syncstudy.backend.service.ExamPlanService;
import com.syncstudy.backend.service.IdempotentAgentTaskService;
import com.syncstudy.backend.service.KnowledgeDocumentService;
import com.syncstudy.backend.service.TodayTaskService;
import com.syncstudy.backend.service.UserMemoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api/internal/agent/users/{userId}")
public class InternalAgentDataController {

    private final UserMemoryService memoryService;
    private final ExamPlanService examPlanService;
    private final TodayTaskService taskService;
    private final KnowledgeDocumentService knowledgeService;
    private final IdempotentAgentTaskService idempotentTaskService;

    public InternalAgentDataController(
            UserMemoryService memoryService,
            ExamPlanService examPlanService,
            TodayTaskService taskService,
            KnowledgeDocumentService knowledgeService,
            IdempotentAgentTaskService idempotentTaskService
    ) {
        this.memoryService = memoryService;
        this.examPlanService = examPlanService;
        this.taskService = taskService;
        this.knowledgeService = knowledgeService;
        this.idempotentTaskService = idempotentTaskService;
    }

    @GetMapping("/memories")
    public ApiResponse<List<UserMemoryResponse>> memories(
            @PathVariable @Positive Long userId
    ) {
        return ApiResponse.success(memoryService.list(userId));
    }

    @PostMapping("/memories")
    public ApiResponse<UserMemoryResponse> upsertMemory(
            @PathVariable @Positive Long userId,
            @Valid @RequestBody UserMemoryRequest request
    ) {
        return ApiResponse.success(memoryService.upsert(userId, request));
    }

    @DeleteMapping("/memories/{id}")
    public ApiResponse<DeletedResponse> deleteMemory(
            @PathVariable @Positive Long userId,
            @PathVariable @Positive Long id
    ) {
        memoryService.delete(userId, id);
        return ApiResponse.success(new DeletedResponse(true));
    }

    @GetMapping("/exams/latest")
    public ApiResponse<ExamPlanResponse> latestExam(
            @PathVariable @Positive Long userId
    ) {
        return ApiResponse.success(examPlanService.getLatest(userId));
    }

    @GetMapping("/today-tasks")
    public ApiResponse<List<TodayTaskItemResponse>> todayTasks(
            @PathVariable @Positive Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ApiResponse.success(taskService.listItems(
                userId,
                date == null ? LocalDate.now() : date
        ));
    }

    @PostMapping("/today-tasks")
    public ApiResponse<TodayTaskItemResponse> createTask(
            @PathVariable @Positive Long userId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody InternalCreateTaskRequest request
    ) {
        return ApiResponse.success(idempotentTaskService.create(
                userId,
                idempotencyKey,
                request
        ));
    }

    @PatchMapping("/today-tasks/{taskId}")
    public ApiResponse<TodayTaskItemResponse> updateTask(
            @PathVariable @Positive Long userId,
            @PathVariable @Positive Long taskId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody InternalTaskUpdateRequest request
    ) {
        return ApiResponse.success(idempotentTaskService.update(
                userId,
                taskId,
                idempotencyKey,
                request
        ));
    }

    @DeleteMapping("/today-tasks/{taskId}")
    public ApiResponse<DeletedResponse> deleteTask(
            @PathVariable @Positive Long userId,
            @PathVariable @Positive Long taskId,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return ApiResponse.success(idempotentTaskService.delete(
                userId,
                taskId,
                idempotencyKey
        ));
    }

    @GetMapping("/knowledge-documents")
    public ApiResponse<List<KnowledgeDocumentResponse>> searchKnowledge(
            @PathVariable @Positive Long userId,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit
    ) {
        return ApiResponse.success(knowledgeService.search(userId, q, limit));
    }
}
