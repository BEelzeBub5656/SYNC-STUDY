package com.syncstudy.backend.service;

import com.syncstudy.backend.client.AgentClient;
import com.syncstudy.backend.dto.AgentChatRequest;
import com.syncstudy.backend.dto.AgentChatResponse;
import com.syncstudy.backend.dto.AiChatRequest;
import com.syncstudy.backend.dto.AiChatResponse;
import com.syncstudy.backend.dto.AgentMoodAdviceRequest;
import com.syncstudy.backend.dto.AgentMoodAdviceResponse;
import com.syncstudy.backend.dto.MoodAdviceRequest;
import com.syncstudy.backend.dto.MoodAdviceResponse;
import com.syncstudy.backend.model.DailyMoodData;
import com.syncstudy.backend.repository.DailyMoodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AiChatService {

    private static final java.util.Set<String> ALLOWED_MOOD_IDS = java.util.Set.of(
            "happy",
            "annoyed",
            "calm",
            "tired"
    );

    private final AgentClient agentClient;
    private final DailyMoodRepository dailyMoodRepository;

    public AiChatService(AgentClient agentClient) {
        this(agentClient, null);
    }

    @Autowired
    public AiChatService(
            AgentClient agentClient,
            DailyMoodRepository dailyMoodRepository
    ) {
        this.agentClient = agentClient;
        this.dailyMoodRepository = dailyMoodRepository;
    }

    public MoodAdviceResponse createMoodAdvice(Long userId, MoodAdviceRequest request) {
        String moodId = request.moodId().trim();
        if (!ALLOWED_MOOD_IDS.contains(moodId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "心情状态不受支持"
            );
        }
        String description = request.description() == null
                ? ""
                : request.description().trim();
        AgentMoodAdviceResponse response = agentClient.moodAdvice(
                new AgentMoodAdviceRequest(
                        userId,
                        moodId,
                        description
                )
        );
        DailyMoodData saved = dailyMoodRepository.upsert(
                userId,
                java.time.LocalDate.now(),
                moodId,
                response.description() == null
                        ? description
                        : response.description().trim(),
                response.advice().trim()
        );
        return toMoodResponse(saved);
    }

    public MoodAdviceResponse getTodayMood(Long userId) {
        return dailyMoodRepository
                .findByUserAndDate(userId, java.time.LocalDate.now())
                .map(this::toMoodResponse)
                .orElse(null);
    }

    private MoodAdviceResponse toMoodResponse(DailyMoodData mood) {
        return new MoodAdviceResponse(
                mood.moodId(),
                mood.description(),
                mood.advice(),
                mood.date()
        );
    }

    public AiChatResponse chat(Long userId, AiChatRequest request) {
        AgentChatResponse response = agentClient.chat(new AgentChatRequest(
                userId,
                request.message().trim(),
                normalizeThreadId(request.threadId())
        ));

        return new AiChatResponse(
                response.status(),
                response.threadId(),
                response.message()
        );
    }

    private String normalizeThreadId(String threadId) {
        if (threadId == null || threadId.isBlank()) {
            return null;
        }
        return threadId.trim();
    }
}
