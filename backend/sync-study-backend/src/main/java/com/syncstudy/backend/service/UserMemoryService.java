package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.UserMemoryRequest;
import com.syncstudy.backend.dto.UserMemoryResponse;
import com.syncstudy.backend.model.UserMemoryData;
import com.syncstudy.backend.repository.UserMemoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class UserMemoryService {

    private static final int MAX_MEMORIES_PER_USER = 20;
    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "PROFILE",
            "INTEREST",
            "LEARNING_PREFERENCE",
            "BACKGROUND"
    );

    private final UserMemoryRepository repository;

    public UserMemoryService(UserMemoryRepository repository) {
        this.repository = repository;
    }

    public List<UserMemoryResponse> list(Long userId) {
        return repository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserMemoryResponse upsert(Long userId, UserMemoryRequest request) {
        return upsert(
                userId,
                request.category(),
                request.memoryKey(),
                request.value()
        );
    }

    @Transactional
    public UserMemoryResponse upsert(
            Long userId,
            String category,
            String memoryKey,
            String value
    ) {
        String normalizedCategory = category.trim();
        String normalizedKey = memoryKey.trim();
        String normalizedValue = value.trim();
        if (!ALLOWED_CATEGORIES.contains(normalizedCategory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "记忆分类不受支持");
        }
        if (normalizedKey.isEmpty() || normalizedValue.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "记忆键和值不能为空");
        }
        if (normalizedKey.length() > 80 || normalizedValue.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "长期记忆内容超过长度限制");
        }
        repository.lockUser(userId);
        boolean alreadyExists = repository.findByKey(
                userId,
                normalizedCategory,
                normalizedKey
        ).isPresent();
        if (!alreadyExists && repository.countByUserId(userId) >= MAX_MEMORIES_PER_USER) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "每位用户最多保存 20 条长期记忆，请先删除不需要的内容"
            );
        }
        return toResponse(repository.upsert(
                userId,
                normalizedCategory,
                normalizedKey,
                normalizedValue
        ));
    }

    public void delete(Long userId, Long id) {
        if (!repository.deleteByIdAndUserId(id, userId)) {
            throw notFound();
        }
    }

    private UserMemoryResponse toResponse(UserMemoryData memory) {
        return new UserMemoryResponse(
                memory.id(),
                memory.userId(),
                memory.category(),
                memory.memoryKey(),
                memory.value(),
                memory.createdAt(),
                memory.updatedAt()
        );
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "长期记忆不存在");
    }
}
