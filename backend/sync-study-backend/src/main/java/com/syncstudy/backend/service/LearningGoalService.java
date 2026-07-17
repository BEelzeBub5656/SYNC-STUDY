package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.LearningGoalResponse;
import com.syncstudy.backend.dto.LearningGoalsResponse;
import com.syncstudy.backend.dto.UpdateLearningGoalRequest;
import com.syncstudy.backend.enums.LearningGoalTerm;
import com.syncstudy.backend.model.LearningGoalData;
import com.syncstudy.backend.repository.LearningGoalRepository;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class LearningGoalService {

    private final LearningGoalRepository repository;
    private final ObjectMapper objectMapper;

    public LearningGoalService(
            LearningGoalRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public LearningGoalsResponse get(Long userId) {
        LearningGoalResponse shortTerm = null;
        LearningGoalResponse longTerm = null;

        for (LearningGoalData goal : repository.findByUserId(userId)) {
            if (goal.term() == LearningGoalTerm.SHORT) {
                shortTerm = toResponse(goal);
            } else if (goal.term() == LearningGoalTerm.LONG) {
                longTerm = toResponse(goal);
            }
        }

        return new LearningGoalsResponse(shortTerm, longTerm);
    }

    public LearningGoalResponse update(
            Long userId,
            LearningGoalTerm term,
            UpdateLearningGoalRequest request
    ) {
        LearningGoalData current = repository
                .findByUserIdAndTerm(userId, term)
                .orElse(null);
        int progressPercent = request.progressPercent() != null
                ? request.progressPercent()
                : current == null ? 0 : current.progressPercent();
        List<String> actions = request.actions() != null
                ? normalizeActions(request.actions())
                : current == null ? List.of() : parseActions(current.actionsJson());

        repository.upsert(
                userId,
                term,
                request.title().trim(),
                request.detail().trim(),
                request.targetDate(),
                progressPercent,
                serializeActions(actions)
        );

        return repository.findByUserIdAndTerm(userId, term)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalStateException("学习目标保存失败"));
    }

    private LearningGoalResponse toResponse(LearningGoalData goal) {
        return new LearningGoalResponse(
                goal.id(),
                goal.term(),
                goal.title(),
                goal.detail(),
                goal.targetDate(),
                goal.progressPercent(),
                parseActions(goal.actionsJson()),
                goal.updatedAt()
        );
    }

    private List<String> normalizeActions(List<String> actions) {
        return actions.stream().map(String::trim).toList();
    }

    private String serializeActions(List<String> actions) {
        try {
            return objectMapper.writeValueAsString(actions);
        } catch (JacksonException exception) {
            throw new IllegalStateException("学习目标行动清单保存失败", exception);
        }
    }

    private List<String> parseActions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JacksonException exception) {
            throw new IllegalStateException("学习目标行动清单读取失败", exception);
        }
    }
}
