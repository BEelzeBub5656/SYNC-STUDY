package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.DeletedResponse;
import com.syncstudy.backend.dto.InternalCreateTaskRequest;
import com.syncstudy.backend.dto.InternalTaskUpdateRequest;
import com.syncstudy.backend.dto.TodayTaskItemResponse;
import com.syncstudy.backend.model.AgentIdempotencyData;
import com.syncstudy.backend.repository.AgentIdempotencyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IdempotentAgentTaskServiceTests {

    @Test
    void duplicateCreateReturnsFirstResponseAndWritesOnce() {
        Fixture fixture = fixture();
        InternalCreateTaskRequest request =
                new InternalCreateTaskRequest("复习闭包", 30, "AGENT");
        TodayTaskItemResponse created = task(41L, "复习闭包", 30, false);
        when(fixture.taskService.createItem(
                eq(7L),
                eq("复习闭包"),
                eq(30),
                eq("AGENT"),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(created);

        TodayTaskItemResponse first = fixture.service.create(7L, "action-1", request);
        TodayTaskItemResponse retry = fixture.service.create(7L, "action-1", request);

        assertEquals(first, retry);
        verify(fixture.taskService, times(1)).createItem(
                eq(7L),
                eq("复习闭包"),
                eq(30),
                eq("AGENT"),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void duplicateUpdateReturnsFirstResponseAndWritesOnce() {
        Fixture fixture = fixture();
        InternalTaskUpdateRequest request =
                new InternalTaskUpdateRequest("完成错题复盘", 25, true);
        TodayTaskItemResponse updated = task(9L, "完成错题复盘", 25, true);
        when(fixture.taskService.updateItem(9L, 7L, request)).thenReturn(updated);

        TodayTaskItemResponse first = fixture.service.update(
                7L, 9L, "action-2", request
        );
        TodayTaskItemResponse retry = fixture.service.update(
                7L, 9L, "action-2", request
        );

        assertEquals(first, retry);
        verify(fixture.taskService, times(1)).updateItem(9L, 7L, request);
    }

    @Test
    void duplicateDeleteReturnsSuccessWithoutDeletingAgain() {
        Fixture fixture = fixture();

        DeletedResponse first = fixture.service.delete(7L, 9L, "action-3");
        DeletedResponse retry = fixture.service.delete(7L, 9L, "action-3");

        assertTrue(first.deleted());
        assertEquals(first, retry);
        verify(fixture.taskService, times(1)).deleteItem(9L, 7L);
    }

    @Test
    void reusingKeyForDifferentRequestIsRejected() {
        Fixture fixture = fixture();
        when(fixture.taskService.createItem(
                eq(7L),
                anyString(),
                eq(30),
                eq("AGENT"),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(task(41L, "复习闭包", 30, false));

        fixture.service.create(
                7L,
                "same-key",
                new InternalCreateTaskRequest("复习闭包", 30, "AGENT")
        );
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> fixture.service.create(
                        7L,
                        "same-key",
                        new InternalCreateTaskRequest("背单词", 30, "AGENT")
                )
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(fixture.taskService, times(1)).createItem(
                eq(7L),
                anyString(),
                eq(30),
                eq("AGENT"),
                org.mockito.ArgumentMatchers.any()
        );
    }

    private Fixture fixture() {
        AgentIdempotencyRepository repository = mock(AgentIdempotencyRepository.class);
        TodayTaskService taskService = mock(TodayTaskService.class);
        AtomicReference<AgentIdempotencyData> state = new AtomicReference<>();

        when(repository.claim(eq(7L), anyString(), anyString(), anyString()))
                .thenAnswer(invocation -> {
                    if (state.get() != null) {
                        return false;
                    }
                    state.set(new AgentIdempotencyData(
                            1L,
                            7L,
                            invocation.getArgument(1),
                            invocation.getArgument(2),
                            invocation.getArgument(3),
                            "PROCESSING",
                            null
                    ));
                    return true;
                });
        when(repository.findForUpdate(eq(7L), anyString(), anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(state.get()));
        when(repository.complete(eq(1L), anyString()))
                .thenAnswer(invocation -> {
                    AgentIdempotencyData current = state.get();
                    state.set(new AgentIdempotencyData(
                            current.id(),
                            current.userId(),
                            current.idempotencyKey(),
                            current.operation(),
                            current.requestFingerprint(),
                            "COMPLETED",
                            invocation.getArgument(1)
                    ));
                    return true;
                });

        return new Fixture(
                new IdempotentAgentTaskService(
                        repository,
                        taskService,
                        new ObjectMapper()
                ),
                taskService
        );
    }

    private TodayTaskItemResponse task(
            Long id,
            String title,
            int minutes,
            boolean completed
    ) {
        return new TodayTaskItemResponse(
                id,
                title,
                minutes,
                "AGENT",
                completed,
                null
        );
    }

    private record Fixture(
            IdempotentAgentTaskService service,
            TodayTaskService taskService
    ) {
    }
}
