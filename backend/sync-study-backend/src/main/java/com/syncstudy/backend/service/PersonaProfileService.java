package com.syncstudy.backend.service;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.syncstudy.backend.dto.PersonaProfileRequest;
import com.syncstudy.backend.dto.PersonaProfileResponse;
import com.syncstudy.backend.repository.PersonaProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PersonaProfileService {

    private final PersonaProfileRepository repository;
    private final ObjectMapper objectMapper;

    public PersonaProfileService(
            PersonaProfileRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public PersonaProfileResponse save(Long userId, PersonaProfileRequest request) {
        validateAnswers(request.answers());
        try {
            repository.save(userId, objectMapper.writeValueAsString(request.answers()));
            return new PersonaProfileResponse(request.answers());
        } catch (JacksonException exception) {
            throw new IllegalStateException("人物画像保存失败", exception);
        }
    }

    public PersonaProfileResponse get(Long userId) {
        return repository.findAnswersJson(userId)
                .map(this::parseAnswers)
                .orElseGet(() -> new PersonaProfileResponse(List.of()));
    }

    private PersonaProfileResponse parseAnswers(String json) {
        try {
            List<List<String>> answers = objectMapper.readValue(
                    json,
                    new TypeReference<>() {
                    }
            );
            return new PersonaProfileResponse(answers);
        } catch (JacksonException exception) {
            throw new IllegalStateException("人物画像读取失败", exception);
        }
    }

    private void validateAnswers(List<List<String>> answers) {
        if (answers.size() != 5 || answers.stream().anyMatch(List::isEmpty)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "请完成五个人物画像步骤"
            );
        }
        boolean invalidTag = answers.stream()
                .flatMap(List::stream)
                .anyMatch(tag -> tag == null || tag.isBlank() || tag.length() > 40);
        if (invalidTag) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "人物画像标签格式不正确"
            );
        }
    }
}
