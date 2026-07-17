package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.DeletedResponse;
import com.syncstudy.backend.dto.InternalCreateTaskRequest;
import com.syncstudy.backend.dto.InternalTaskUpdateRequest;
import com.syncstudy.backend.dto.TodayTaskItemResponse;
import com.syncstudy.backend.model.AgentIdempotencyData;
import com.syncstudy.backend.repository.AgentIdempotencyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

@Service
@Transactional
public class IdempotentAgentTaskService {

    static final String CREATE_OPERATION = "TODAY_TASK_CREATE";
    static final String UPDATE_OPERATION = "TODAY_TASK_UPDATE";
    static final String DELETE_OPERATION = "TODAY_TASK_DELETE";

    private final AgentIdempotencyRepository idempotencyRepository;
    private final TodayTaskService taskService;
    private final ObjectMapper objectMapper;

    public IdempotentAgentTaskService(
            AgentIdempotencyRepository idempotencyRepository,
            TodayTaskService taskService,
            ObjectMapper objectMapper
    ) {
        this.idempotencyRepository = idempotencyRepository;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }

    public TodayTaskItemResponse create(
            Long userId,
            String idempotencyKey,
            InternalCreateTaskRequest request
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", request.title().trim());
        payload.put("estimatedMinutes", request.estimatedMinutes());
        payload.put("source", request.source());
        return execute(
                userId,
                idempotencyKey,
                CREATE_OPERATION,
                fingerprint(payload),
                TodayTaskItemResponse.class,
                () -> taskService.createItem(
                        userId,
                        request.title(),
                        request.estimatedMinutes(),
                        request.source(),
                        LocalDate.now()
                )
        );
    }

    public TodayTaskItemResponse update(
            Long userId,
            Long taskId,
            String idempotencyKey,
            InternalTaskUpdateRequest request
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("taskId", taskId);
        payload.put("title", request.title() == null ? null : request.title().trim());
        payload.put("estimatedMinutes", request.estimatedMinutes());
        payload.put("completed", request.completed());
        return execute(
                userId,
                idempotencyKey,
                UPDATE_OPERATION,
                fingerprint(payload),
                TodayTaskItemResponse.class,
                () -> taskService.updateItem(taskId, userId, request)
        );
    }

    public DeletedResponse delete(
            Long userId,
            Long taskId,
            String idempotencyKey
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("taskId", taskId);
        return execute(
                userId,
                idempotencyKey,
                DELETE_OPERATION,
                fingerprint(payload),
                DeletedResponse.class,
                () -> {
                    taskService.deleteItem(taskId, userId);
                    return new DeletedResponse(true);
                }
        );
    }

    private <T> T execute(
            Long userId,
            String rawIdempotencyKey,
            String operation,
            String requestFingerprint,
            Class<T> responseType,
            Supplier<T> action
    ) {
        String idempotencyKey = normalizeKey(rawIdempotencyKey);
        boolean claimed = idempotencyRepository.claim(
                userId,
                idempotencyKey,
                operation,
                requestFingerprint
        );
        AgentIdempotencyData record = idempotencyRepository.findForUpdate(
                userId,
                idempotencyKey,
                operation
        ).orElseThrow(() -> new IllegalStateException("幂等请求记录创建失败"));

        if (!MessageDigest.isEqual(
                record.requestFingerprint().getBytes(StandardCharsets.US_ASCII),
                requestFingerprint.getBytes(StandardCharsets.US_ASCII)
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "同一个 Idempotency-Key 不能用于不同请求"
            );
        }
        if (!claimed) {
            if (!record.completed() || record.responseJson() == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "同一幂等请求正在处理中"
                );
            }
            return deserialize(record.responseJson(), responseType);
        }

        T response = action.get();
        String responseJson = serialize(response);
        if (!idempotencyRepository.complete(record.id(), responseJson)) {
            throw new IllegalStateException("幂等请求结果保存失败");
        }
        return response;
    }

    private String normalizeKey(String key) {
        if (key == null || key.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Idempotency-Key 不能为空"
            );
        }
        String normalized = key.trim();
        if (normalized.length() > 128) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Idempotency-Key 不能超过 128 个字符"
            );
        }
        return normalized;
    }

    private String fingerprint(Map<String, Object> payload) {
        try {
            byte[] canonicalRequest = objectMapper.writeValueAsBytes(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(canonicalRequest));
        } catch (JacksonException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("无法生成请求指纹", exception);
        }
    }

    private String serialize(Object response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法保存幂等请求响应", exception);
        }
    }

    private <T> T deserialize(String responseJson, Class<T> responseType) {
        try {
            return objectMapper.readValue(responseJson, responseType);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法读取幂等请求响应", exception);
        }
    }
}
