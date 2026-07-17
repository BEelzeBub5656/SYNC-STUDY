package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.KnowledgeDocumentRequest;
import com.syncstudy.backend.dto.KnowledgeDocumentResponse;
import com.syncstudy.backend.model.KnowledgeDocumentData;
import com.syncstudy.backend.repository.KnowledgeDocumentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class KnowledgeDocumentService {

    private final KnowledgeDocumentRepository repository;

    public KnowledgeDocumentService(KnowledgeDocumentRepository repository) {
        this.repository = repository;
    }

    public List<KnowledgeDocumentResponse> search(Long userId, String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return repository.search(userId, query, safeLimit).stream()
                .map(this::toResponse)
                .toList();
    }

    public KnowledgeDocumentResponse create(Long userId, KnowledgeDocumentRequest request) {
        Long id = repository.insert(
                userId,
                request.title().trim(),
                request.course().trim(),
                request.sourceType().trim(),
                request.content().trim()
        );
        KnowledgeDocumentData document = repository.findOwned(id, userId);
        if (document == null) {
            throw new IllegalStateException("课程资料创建后无法读取");
        }
        return toResponse(document);
    }

    public void delete(Long userId, Long id) {
        if (!repository.delete(id, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "课程资料不存在");
        }
    }

    private KnowledgeDocumentResponse toResponse(KnowledgeDocumentData document) {
        return new KnowledgeDocumentResponse(
                document.id(),
                document.userId(),
                document.title(),
                document.course(),
                document.sourceType(),
                document.content(),
                document.createdAt(),
                document.updatedAt()
        );
    }
}
