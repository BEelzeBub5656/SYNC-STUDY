package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.LearningGoalResponse;
import com.syncstudy.backend.dto.LearningGoalsResponse;
import com.syncstudy.backend.dto.UpdateLearningGoalRequest;
import com.syncstudy.backend.enums.LearningGoalTerm;
import com.syncstudy.backend.model.LearningGoalData;
import com.syncstudy.backend.repository.LearningGoalRepository;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LearningGoalServiceTests {

    @Test
    void returnsGoalsInTheirTermSlots() {
        LearningGoalRepository repository = mock(LearningGoalRepository.class);
        LearningGoalService service = new LearningGoalService(
                repository,
                new ObjectMapper()
        );
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 16, 12, 30);
        LearningGoalData longTerm = goal(
                2L,
                LearningGoalTerm.LONG,
                "英语四级",
                "通过英语四级考试",
                "[\"每天背30个单词\"]",
                updatedAt
        );
        LearningGoalData shortTerm = goal(
                1L,
                LearningGoalTerm.SHORT,
                "考试",
                "准备研究生考试",
                "[\"完成数学复习\",\"整理英语错题\"]",
                updatedAt
        );
        when(repository.findByUserId(7L)).thenReturn(List.of(longTerm, shortTerm));

        LearningGoalsResponse response = service.get(7L);

        assertEquals("考试", response.shortTerm().title());
        assertEquals(List.of("完成数学复习", "整理英语错题"),
                response.shortTerm().actions());
        assertEquals("英语四级", response.longTerm().title());
    }

    @Test
    void updateCreatesAFirstGoalWithDefaultProgressAndActions() {
        LearningGoalRepository repository = mock(LearningGoalRepository.class);
        LearningGoalService service = new LearningGoalService(
                repository,
                new ObjectMapper()
        );
        LocalDate targetDate = LocalDate.of(2026, 9, 16);
        LearningGoalData saved = new LearningGoalData(
                10L,
                7L,
                LearningGoalTerm.SHORT,
                "考试",
                "考研",
                targetDate,
                0,
                "[]",
                LocalDateTime.of(2026, 7, 16, 12, 30)
        );
        when(repository.findByUserIdAndTerm(7L, LearningGoalTerm.SHORT))
                .thenReturn(Optional.empty(), Optional.of(saved));

        LearningGoalResponse response = service.update(
                7L,
                LearningGoalTerm.SHORT,
                new UpdateLearningGoalRequest(
                        "  考试  ",
                        "  考研  ",
                        targetDate,
                        null,
                        null
                )
        );

        verify(repository).upsert(
                7L,
                LearningGoalTerm.SHORT,
                "考试",
                "考研",
                targetDate,
                0,
                "[]"
        );
        assertEquals(10L, response.id());
        assertEquals(0, response.progressPercent());
        assertEquals(List.of(), response.actions());
    }

    @Test
    void getReturnsNullForAnUnsetTerm() {
        LearningGoalRepository repository = mock(LearningGoalRepository.class);
        LearningGoalService service = new LearningGoalService(
                repository,
                new ObjectMapper()
        );
        when(repository.findByUserId(7L)).thenReturn(List.of(
                goal(
                        1L,
                        LearningGoalTerm.SHORT,
                        "考试",
                        "考研",
                        "[]",
                        LocalDateTime.of(2026, 7, 16, 12, 30)
                )
        ));

        LearningGoalsResponse response = service.get(7L);

        assertEquals("考试", response.shortTerm().title());
        assertNull(response.longTerm());
    }

    private LearningGoalData goal(
            Long id,
            LearningGoalTerm term,
            String title,
            String detail,
            String actionsJson,
            LocalDateTime updatedAt
    ) {
        return new LearningGoalData(
                id,
                7L,
                term,
                title,
                detail,
                null,
                62,
                actionsJson,
                updatedAt
        );
    }
}
