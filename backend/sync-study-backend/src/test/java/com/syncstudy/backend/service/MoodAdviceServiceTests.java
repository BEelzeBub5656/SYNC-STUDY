package com.syncstudy.backend.service;

import com.syncstudy.backend.client.AgentClient;
import com.syncstudy.backend.dto.AgentMoodAdviceRequest;
import com.syncstudy.backend.dto.AgentMoodAdviceResponse;
import com.syncstudy.backend.dto.MoodAdviceRequest;
import com.syncstudy.backend.model.DailyMoodData;
import com.syncstudy.backend.repository.DailyMoodRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MoodAdviceServiceTests {

    @Test
    void invalidMoodIsRejectedBeforeCallingAgentOrDatabase() {
        AgentClient agentClient = mock(AgentClient.class);
        DailyMoodRepository repository = mock(DailyMoodRepository.class);
        AiChatService service = new AiChatService(agentClient, repository);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.createMoodAdvice(
                        7L,
                        new MoodAdviceRequest("angry", "很生气")
                )
        );

        assertEquals(400, exception.getStatusCode().value());
        verifyNoInteractions(agentClient, repository);
    }

    @Test
    void storesTheValidatedRequestMoodInsteadOfTrustingAgentMoodId() {
        AgentClient agentClient = mock(AgentClient.class);
        DailyMoodRepository repository = mock(DailyMoodRepository.class);
        when(agentClient.moodAdvice(any(AgentMoodAdviceRequest.class)))
                .thenReturn(new AgentMoodAdviceResponse(
                        "tired",
                        "今天很好",
                        "适合进行一轮轻量复习。"
                ));
        LocalDate today = LocalDate.now();
        when(repository.upsert(
                7L,
                today,
                "happy",
                "今天很好",
                "适合进行一轮轻量复习。"
        )).thenReturn(new DailyMoodData(
                1L,
                7L,
                today,
                "happy",
                "今天很好",
                "适合进行一轮轻量复习。",
                LocalDateTime.now(),
                LocalDateTime.now()
        ));
        AiChatService service = new AiChatService(agentClient, repository);

        var response = service.createMoodAdvice(
                7L,
                new MoodAdviceRequest("happy", "今天很好")
        );

        assertEquals("happy", response.moodId());
        verify(repository).upsert(
                7L,
                today,
                "happy",
                "今天很好",
                "适合进行一轮轻量复习。"
        );
        verify(repository, never()).upsert(
                7L,
                today,
                "tired",
                "今天很好",
                "适合进行一轮轻量复习。"
        );
    }
}
