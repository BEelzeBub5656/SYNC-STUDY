package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.InternalTaskUpdateRequest;
import com.syncstudy.backend.model.TodayTaskData;
import com.syncstudy.backend.repository.StudyCheckInRepository;
import com.syncstudy.backend.repository.TodayTaskRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TodayTaskMutationServiceTests {

    @Test
    void updateUsesTaskIdAndUserIdTogether() {
        TodayTaskRepository repository = mock(TodayTaskRepository.class);
        StudyCheckInRepository checkIns = mock(StudyCheckInRepository.class);
        TodayTaskData before = task("旧标题", 20, false);
        TodayTaskData after = task("新标题", 30, true);
        when(repository.findByIdAndUserId(3L, 8L))
                .thenReturn(Optional.of(before), Optional.of(after));
        when(repository.update(3L, 8L, "新标题", 30, true)).thenReturn(true);
        TodayTaskService service = new TodayTaskService(repository, checkIns);

        var result = service.updateItem(
                3L,
                8L,
                new InternalTaskUpdateRequest(" 新标题 ", 30, true)
        );

        assertEquals("新标题", result.title());
        assertEquals(30, result.estimatedMinutes());
        verify(repository).update(3L, 8L, "新标题", 30, true);
    }

    private TodayTaskData task(String title, int minutes, boolean completed) {
        return new TodayTaskData(
                3L,
                8L,
                title,
                minutes,
                "AI",
                completed,
                LocalDate.now(),
                completed ? LocalDateTime.now() : null,
                LocalDateTime.now()
        );
    }
}
