package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.UserMemoryRequest;
import com.syncstudy.backend.model.UserMemoryData;
import com.syncstudy.backend.repository.UserMemoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class UserMemoryServiceTests {

    @Test
    void refusesANewMemoryAfterThePerUserLimit() {
        UserMemoryRepository repository = mock(UserMemoryRepository.class);
        when(repository.findByKey(7L, "INTEREST", "favorite_subject"))
                .thenReturn(Optional.empty());
        when(repository.countByUserId(7L)).thenReturn(20);
        UserMemoryService service = new UserMemoryService(repository);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.upsert(
                        7L,
                        "INTEREST",
                        "favorite_subject",
                        "英语"
                )
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(repository, never()).upsert(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString()
        );
    }

    @Test
    void updatingAnExistingKeyDoesNotConsumeAnotherSlot() {
        UserMemoryRepository repository = mock(UserMemoryRepository.class);
        LocalDateTime now = LocalDateTime.now();
        UserMemoryData existing = new UserMemoryData(
                2L, 7L, "PROFILE", "name", "旧名字", now, now
        );
        UserMemoryData updated = new UserMemoryData(
                2L, 7L, "PROFILE", "name", "新名字", now, now
        );
        when(repository.findByKey(7L, "PROFILE", "name"))
                .thenReturn(Optional.of(existing));
        when(repository.upsert(7L, "PROFILE", "name", "新名字"))
                .thenReturn(updated);
        UserMemoryService service = new UserMemoryService(repository);

        var response = service.upsert(7L, "PROFILE", "name", "新名字");

        assertEquals("新名字", response.value());
        verify(repository, never()).countByUserId(7L);
    }

    @Test
    void upsertScopesMemoryToAuthenticatedUserAndTrimsValues() {
        UserMemoryRepository repository = mock(UserMemoryRepository.class);
        LocalDateTime now = LocalDateTime.now();
        when(repository.upsert(7L, "PROFILE", "name", "Jessica"))
                .thenReturn(new UserMemoryData(
                        1L,
                        7L,
                        "PROFILE",
                        "name",
                        "Jessica",
                        now,
                        now
                ));
        UserMemoryService service = new UserMemoryService(repository);

        var response = service.upsert(
                7L,
                new UserMemoryRequest("PROFILE", " name ", " Jessica ")
        );

        assertEquals(7L, response.userId());
        assertEquals("Jessica", response.value());
        verify(repository).upsert(7L, "PROFILE", "name", "Jessica");
    }

    @Test
    void deleteNeverFallsBackToAnUnscopedDelete() {
        UserMemoryRepository repository = mock(UserMemoryRepository.class);
        when(repository.deleteByIdAndUserId(9L, 7L)).thenReturn(false);
        UserMemoryService service = new UserMemoryService(repository);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.delete(7L, 9L)
        );

        assertEquals(404, exception.getStatusCode().value());
        verify(repository).deleteByIdAndUserId(9L, 7L);
    }
}
